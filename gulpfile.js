var gulp = require('gulp');
var path = require('path');
var webpack = require('webpack');
var bower = require('gulp-bower');
var less = require('gulp-less');
var del = require('del');
var util = require('gulp-util');
var cached = require('gulp-cached');
var remember = require('gulp-remember');
var autoprefixer = require('gulp-autoprefixer');
var csso = require('gulp-csso');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var spritesmith = require('gulp.spritesmith');
var htmlreplace = require('gulp-html-replace');
var uglify = require('gulp-uglify');
var filter = require('gulp-filter');
var merge = require('merge-stream');
var babel = require('gulp-babel');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var eslint = require('gulp-eslint');
var WebpackDevServer = require("webpack-dev-server");
var gulpStylelint = require('gulp-stylelint');

var argv = require('minimist')(process.argv.slice(2), {
    string: 'env',
    default: {env: process.env.NODE_ENV || 'development'}
});

var conf = {
    less: 'src/less/*.less',
    images: ['src/images/**/*.{png,svg}', '!src/images/icons/**'],
    icons: 'src/images/icons/*.png',
    html: 'src/*.html',
    sprite: {
        imgName: 'images/build/sprite.png',
        cssName: 'less/build/sprite.less',
        imgPath: '../../images/build/sprite.png'
    },
    build: {
        tmpFolders: '**/build',
        folder: 'build',
        css: 'build/css',
        images: 'build/images',
        js: 'build/js',
        html: 'build'
    }
};

var bootstrap = {
    less: 'bower_components/bootstrap/less/bootstrap.less'
};

var myConfig = {
    entry: "./src/js/entry.js",
    module: {
        loaders: [
            {
                test: /\.json$/, loader: 'json-loader'
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader?sourceMap", {publicPath: "../"})
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader?sourceMap!less-loader?sourceMap", {publicPath: "../"}),
            },
            {
                test: /\.png/,
                loader: "url-loader?name=images/build/[name].[ext]&limit=10000"
            },
            {
                test: /\.ttf(\?.*)?$/,
                loader: `url?prefix=fonts/&name=fonts/[name].[ext]&limit=10000&mimetype=application/octet-stream`
            },
            {
                test: /\.svg(\?.*)?$/,
                loader: `url-loader?&name=images/[name].[ext]&limit=10000&mimetype=image/svg+xml`
            },
            {
                test: /\.woff(\?.*)?$/,
                loader: `url?prefix=fonts/&name=fonts/[name].[ext]&limit=10000&mimetype=application/font-woff`
            },
            {
                test: /\.eot(\?.*)?$/,
                loader: `file?prefix=fonts/&name=fonts/[name].[ext]`
            },
            {
                test: /\.woff2(\?.*)?$/,
                loader: `url?prefix=fonts/&name=fonts/[name].[ext]&limit=10000&mimetype=application/font-woff2`
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('./css/cdp.css', {allChunks: true}),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        })
    ],
    stats: {
        colors: true,
        modules: true,
        reasons: true,
        errorDetails: true
    }
};

gulp.task('bower', function () {
    return bower()
        .pipe(gulp.dest('bower_components'));
});

gulp.task('images', ['clean', 'bower', 'sprite'], function () {
    return gulp.src(conf.images)
        .pipe(gulpif(argv.env === 'production', imagemin()))
        .pipe(gulp.dest(conf.build.images))
});

gulp.task('sprite', ['clean'], function () {
    return gulp.src(conf.icons)
        .pipe(spritesmith(conf.sprite))
        .pipe(gulp.dest('src/'));
});

gulp.task('html', ['clean'], function () {
    return gulp.src(conf.html)
        .pipe(htmlreplace({
            'css': '../css/cdp.css',
            'js': '../js/bundle.js',
            'logo': {
                src: '../images/logo_gray-blue_80px.svg',
                tpl: '<img src="%s" alt="Epam logo"/>'
            }
        }))
        .pipe(gulp.dest(conf.build.html));
});

gulp.task('build', ['bundle', 'html'], function () {

});

gulp.task('build:prod', ['bundle:prod', 'html'], function () {

});

gulp.task('bundle', ['clean', 'images'], function (callback) {
    webpack(Object.assign(myConfig, {
        devtool: 'source-map',
        output: {
            path: './build',
            filename: 'js/bundle.js'
        }
    }), function (err) {
        callback();
    });
});

gulp.task('bundle:prod', ['clean', 'images'], function (callback) {
    // run webpack
    webpack(Object.assign(myConfig, {
        output: {
            path: './build',
            filename: 'js/bundle.js'
        },
        plugins: myConfig.plugins.concat([
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false
                }
            })
        ])
    }), function (err) {
        callback();
    });
});

gulp.task("watch-bundle", ['clean', 'images', 'html'], function (callback) {
    // Start a webpack-dev-server
    var compiler = webpack(Object.assign(myConfig, {
        devtool: 'source-map',
        output: {
            path: '/build',
            filename: 'js/bundle.js'
        }
    }));

    new WebpackDevServer(compiler, {
        contentBase: './build'
    }).listen(8080, "localhost", function (err) {
        callback();
    });
});

gulp.task('watch', ['watch-bundle', 'html'], function () {

});

gulp.task('clean', function () {
    return del([conf.build.folder, conf.build.tmpFolders]);
});

gulp.task('lint', ['lint:script', 'lint:style'], function() {
});

gulp.task('lint:script', () => {
    return gulp.src(['./src/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('lint:style', () => {
    return gulp.src('./src/**/*.css')
        .pipe(gulpStylelint({
            reporters: [
                {
                    formatter: 'string', console: true
                }
            ]
        }));
});

function errorHandler(error) {
    util.log(util.colors.red('Error'), error.message);

    this.end();
}
