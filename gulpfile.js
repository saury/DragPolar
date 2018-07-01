'use strict';

var gulp = require('gulp'),
  browserSync = require('browser-sync').create(),
  reload = browserSync.reload;

gulp.task('default', function() {
  browserSync.init({
    open: 'external',
    notify: false,
    server: {
      baseDir: ['./', './example'],
    },
  });
  gulp.watch('./example/*.html').on('change', reload);
  gulp.watch('./example/*.js').on('change', reload);
  gulp.watch('./dist/*.js').on('change', reload);
});
