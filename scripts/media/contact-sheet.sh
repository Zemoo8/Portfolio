#!/usr/bin/env bash
# Contact sheet for media QC: bash contact-sheet.sh <video> <out.jpg> [cols] [every_seconds]
ffmpeg -y -loglevel error -i "$1" -vf "fps=1/${4:-1.5},scale=480:-2,tile=${3:-4}x4:padding=4:color=white" -frames:v 1 -q:v 4 "$2"
