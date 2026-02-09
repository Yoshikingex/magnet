#!/bin/sh
echo "=== Environment Check ==="
echo "BASIC_AUTH_USER is set: $([ -n "$BASIC_AUTH_USER" ] && echo 'YES' || echo 'NO')"
echo "BASIC_AUTH_PASS is set: $([ -n "$BASIC_AUTH_PASS" ] && echo 'YES' || echo 'NO')"
echo "BASIC_AUTH_USER length: $(echo -n "$BASIC_AUTH_USER" | wc -c)"
echo "BASIC_AUTH_PASS length: $(echo -n "$BASIC_AUTH_PASS" | wc -c)"
echo "NODE_ENV: $NODE_ENV"
echo "========================="
exec node server.js
