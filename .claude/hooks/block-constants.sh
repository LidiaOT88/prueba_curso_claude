#!/usr/bin/env bash
# PreToolUse hook: deny any attempt to read the sensitive constants file.

input=$(cat)

targets=$(echo "$input" | jq -r '[.tool_input.file_path, .tool_input.path, .tool_input.pattern, .tool_input.glob, .tool_input.command] | map(select(. != null)) | join(" ")')

if echo "$targets" | grep -q 'constants\.js'; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"No puedo leer ese archivo"}}'
fi

exit 0
