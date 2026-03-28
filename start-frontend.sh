#!/bin/bash
cd /opt/xuexi/frontend
exec node node_modules/.bin/serve -s dist -l 3000
