# A sample Guardfile
# More info at https://github.com/guard/guard#readme

guard :haml do
  watch('index2.html.haml')
end

guard 'sass', :input => 'css/sass', :output => 'css', :compass => {
  :images_dir => 'images',
  :images_path => 'images',
  :http_images_path => '../images',
  :http_images_dir => '../images',
  :line_comments => true,
  :output_style => :nested
}

guard 'livereload' do
  watch('css/screen.css')
  watch('index.html')
end

