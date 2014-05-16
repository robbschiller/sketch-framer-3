task :default do
  # concat files
  system("cat preamble.js sandbox.js sketch-framer.js export.js > sketch-framer-cmd.js")
  system("./coscript sketch-framer-cmd.js 2>/dev/null") # This doesn't work
end