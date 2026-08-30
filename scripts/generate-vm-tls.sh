#!/bin/sh
set -eu

tls_directory="${1:-../tls}"
certificate="$tls_directory/fullchain.pem"
private_key="$tls_directory/privkey.pem"

if [ -e "$certificate" ] || [ -L "$certificate" ] || [ -e "$private_key" ] || [ -L "$private_key" ]; then
  echo "Refusing to overwrite existing VM TLS files in: $tls_directory" >&2
  exit 1
fi

umask 077
mkdir -p "$tls_directory"
openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 30 \
  -subj "/CN=lumina.sg" \
  -addext "subjectAltName=DNS:lumina.sg" \
  -keyout "$private_key" \
  -out "$certificate" >/dev/null 2>&1
chmod 600 "$private_key"
chmod 644 "$certificate"
echo "Created 30-day self-signed VM certificate for lumina.sg in $tls_directory."
