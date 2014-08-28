'use strict';

var gulp = require('gulp');

// Load plugins
var $ = require('gulp-load-plugins')();

// Scripts
gulp.task('scripts', function () {
    return gulp.src('app/scripts/app.js')
        .pipe($.browserify())
        .pipe($.jshint('.jshintrc'))
        .pipe($.jshint.reporter('default'))
        .pipe(gulp.dest('dist/scripts'))
        .pipe($.size())
        .pipe($.connect.reload());
    });

// HTML
gulp.task('html', function () {
    return gulp.src('app/*.html')
        .pipe($.useref())
        .pipe(gulp.dest('dist'))
        .pipe($.size())
        .pipe($.connect.reload());
});

// Images
gulp.task('images', function () {
    return gulp.src('app/images/**/*')
        .pipe(gulp.dest('dist/images'))
        .pipe($.size())
        .pipe($.connect.reload());
});

// Clean
gulp.task('clean', function () {
    return gulp.src(['dist/styles', 'dist/scripts', 'dist/images'], {read: false}).pipe($.clean());
});


// Bundle
gulp.task('bundle', ['scripts', 'bower'], function(){
    return gulp.src('./app/*.html')
               .pipe($.useref.assets())
               .pipe($.useref.restore())
               .pipe($.useref())
               .pipe(gulp.dest('dist'));
});

// Build
gulp.task('build', ['html', 'bundle', 'images', 'styles']);

// Default task
gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

// Connect
gulp.task('connect', $.connect.server({
    root: ['dist'],
    port: 9001,
    livereload: true
}));

// Bower helper
gulp.task('bower', function() {
    gulp.src('app/bower_components/**/*.js', {base: 'app/bower_components'})
        .pipe(gulp.dest('dist/bower_components/'));

});

gulp.task('json', function() {
    gulp.src('app/scripts/json/**/*.json', {base: 'app/scripts'})
        .pipe(gulp.dest('dist/scripts/'));
});


// Watch
gulp.task('watch', ['html', 'images', 'bundle', 'connect'], function () {

    // Watch .json files
    gulp.watch('app/scripts/**/*.json', ['json']);

    // Watch .html files
    gulp.watch('app/*.html', ['html']);



    gulp.watch('node_modules/impulse/lib/*.js', ['scripts']);


    // Watch .jsx files
    // gulp.watch('app/scripts/**/*.jsx', ['jsx', 'scripts']);

    // Watch .js files
    gulp.watch('app/scripts/**/*.js', ['scripts']);

    // Watch image files
    gulp.watch('app/images/**/*', ['images']);
});
