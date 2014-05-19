task :default do
  # concat files
  system("echo '// Export to Framer 3 (ctrl alt cmd f)\n' > 'Export to Framer.sketchplugin'")
  system("echo '(function(){\n' >> 'Export to Framer.sketchplugin'")
  system("cat src/preamble.js src/sandbox.js src/sketch-framer.js src/export.js >> 'Export to Framer.sketchplugin'")
  system("echo '}())\n' >> 'Export to Framer.sketchplugin'")
  # run script
  # system("bin/coscript nightly.js 2>/dev/null")
end
