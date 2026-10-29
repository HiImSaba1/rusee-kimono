#!/usr/bin/env bash

set -Eeuo pipefail

release_label="${1:-standalone}"
if [[ ! "$release_label" =~ ^[a-z0-9][a-z0-9-]{0,31}$ ]]; then
  echo "Release label must use lowercase letters, numbers, and hyphens only." >&2
  exit 2
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source_root="$(cd -- "$script_dir/.." && pwd)"

for command_name in node npm tar sha256sum find git; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "$command_name is required." >&2
    exit 3
  }
done

node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [[ "$node_major" -ne 22 ]]; then
  echo "Node.js 22 is required; found $(node --version)." >&2
  exit 3
fi

timestamp="$(date -u +%Y%m%d-%H%M%S)"
commit="${GITHUB_SHA:-$(git -C "$source_root" rev-parse HEAD)}"
short_commit="${commit:0:12}"
work_root="$(mktemp -d "/tmp/rusee-papaki-${release_label}-XXXXXX")"
release_root="$work_root/release"
output_dir="$source_root/tmp"
archive_name="rusee-papaki-standalone-${release_label}-${short_commit}-${timestamp}.tar.gz"
archive_path="$output_dir/$archive_name"

cleanup() {
  rm -rf -- "$work_root"
}
trap cleanup EXIT

mkdir -p -- "$release_root/.next/standalone" "$output_dir"

cd -- "$source_root"

echo "Installing exact locked dependencies..."
npm ci --legacy-peer-deps --no-audit --no-fund --loglevel=error

echo "Running release-contract tests..."
node node_modules/vitest/vitest.mjs run tests/production-release.test.ts src/lib/seo/indexing.test.ts src/lib/seo/product-schema.test.ts

echo "Building the Linux standalone runtime..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export UV_THREADPOOL_SIZE=1
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build:plesk

required_build_paths=(
  ".next/standalone/server.js"
  ".next/standalone/.next/BUILD_ID"
  ".next/standalone/.next/server"
  ".next/standalone/.next/required-server-files.json"
  ".next/standalone/.next/static"
  ".next/standalone/public"
  ".next/standalone/public/kimono_images_optimized/kimono-home-group-dance.mp4"
  ".next/standalone/public/kimono_images_optimized/kimono_design_grouped_1.webp"
)

for required_path in "${required_build_paths[@]}"; do
  [[ -e "$source_root/$required_path" ]] || {
    echo "Standalone build output is incomplete: missing $required_path" >&2
    exit 4
  }
done

cp -a -- "$source_root/.next/standalone/." "$release_root/.next/standalone/"
cp -a -- "$source_root/start.js" "$release_root/start.js"

build_id="$(tr -d '\r\n' < "$release_root/.next/standalone/.next/BUILD_ID")"
cat > "$release_root/RELEASE_MANIFEST.txt" <<EOF
RUSEE PAPAKI STANDALONE RELEASE

Commit: $commit
Release: $release_label
Built UTC: $timestamp
Node: $(node --version)
Build ID: $build_id

This release contains the Plesk startup wrapper and traced standalone runtime.
It contains no environment file, database snapshot, verification artifact, or
source build workspace. Production environment and rollback remain Plesk-owned.
EOF

native_swc="$(find "$release_root/.next/standalone" -type f \( -path '*/@next/swc-*/*.node' -o -name 'next-swc*.node' \) -print -quit)"
if [[ -n "$native_swc" ]]; then
  echo "Standalone runtime unexpectedly contains a native SWC binary: $native_swc" >&2
  exit 5
fi

if find "$release_root" -type f \( -name '.env' -o -name '.env.*' -o -name 'next_kimono.sql' \) -print -quit | grep -q .; then
  echo "Release tree contains a forbidden environment or database file." >&2
  exit 5
fi

echo "Packaging the verified standalone runtime..."
tar -czf "$archive_path" -C "$release_root" .
(
  cd -- "$output_dir"
  sha256sum "$archive_name" > "${archive_name}.sha256"
)

echo "Papaki standalone release created: $archive_path"
echo "Checksum: ${archive_path}.sha256"
echo "Build ID: $build_id"
