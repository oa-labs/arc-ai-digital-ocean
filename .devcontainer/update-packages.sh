#!/bin/sh

pnpm outdated
pnpm up -i --latest
pnpm dedupe
pnpm outdated
