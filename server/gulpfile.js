var gulp = require('gulp');
var zip = require('gulp-zip');
var version = '0.1';
gulp.task('zip', () => {
         gulp.src(['static/**', './*.js'])
        .pipe(zip('card_duel_v' + version + '.zip'))
        .pipe(gulp.dest('dist'));
});