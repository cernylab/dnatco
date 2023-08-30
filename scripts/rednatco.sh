BIN_DIR="$(dirname $0)/../bin"

node -r browser-env/register "${BIN_DIR}/rednatco.js" $@
