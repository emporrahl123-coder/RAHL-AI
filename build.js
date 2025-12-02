const fs = require('fs');
const { exec } = require('child_process');

console.log('🚀 Building RAHL AI...');

// Minify CSS
exec('npx cleancss -o style.min.css style.css', (error) => {
    if (error) console.log('CSS minification skipped');
    else console.log('✅ CSS minified');
});

// Minify JS
exec('npx terser app.js -o app.min.js', (error) => {
    if (error) console.log('JS minification skipped');
    else console.log('✅ JS minified');
});

console.log('🎉 Build completed!');
