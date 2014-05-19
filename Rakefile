task :default do
  # concat files
  system("echo '// Export to Framer 3 (ctrl alt cmd f)\n' > 'Export to Framer.sketchplugin'")
  system("echo '(function(){\n' >> 'Export to Framer.sketchplugin'")
  system("cat preamble.js sandbox.js sketch-framer.js export.js >> 'Export to Framer.sketchplugin'")
  system("echo '}())\n' >> 'Export to Framer.sketchplugin'")
  # run script
  # system("bin/coscript nightly.js 2>/dev/null")
end
