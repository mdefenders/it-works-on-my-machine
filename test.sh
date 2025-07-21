#!/bin/bash
curl -s http://localhost:3000/health | grep "Still working" && echo "PASS ✅" || echo "FAIL ❌"