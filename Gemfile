source "https://rubygems.org"

# Fastlane drives the Android preview build (see fastlane/Fastfile), invoked by
# the manually-dispatched .github/workflows/android-build.yml. Plugins live in
# fastlane/Pluginfile and are pulled in below via the standard Fastlane pattern.
gem "fastlane"

plugins_path = File.join(File.dirname(__FILE__), "fastlane", "Pluginfile")
eval_gemfile(plugins_path) if File.exist?(plugins_path)
