//npm i - для установки всех пакетов из node_modules

let build_folder = "build";
let source_folder = "_src";

let fs = require('fs');

let path = {
    build: {
        html: build_folder+"/",
        css: build_folder+"/css/",
        scripts: build_folder+"/scripts/",
        img: build_folder+"/img/",
        fonts: build_folder+"/fonts/",
        libs: build_folder+"/libs/"
    },
    source: {
        html: [source_folder+"/html/*.html", "!"+source_folder+"/html/@*.html"],
        css: source_folder+"/scss/main.scss",
        scripts: source_folder+"/scripts/main.js",
        img: source_folder+"/img/**/*.{jpg,png,gif,ico,webp}",
        fonts: source_folder+"/fonts/*.ttf",
        libs: source_folder+"/libs/"
    },
    watch: {
        html: source_folder+"/html/**/*.html",
        css: source_folder+"/scss/**/*.scss",
        scripts: source_folder+"/scripts/**/*.js",
        img: source_folder+"/img/**/*.{jpg,png,gif,ico,webp}",
    },
    clean:"./" + build_folder + "/"
}

let { src, dest } = require('gulp'),
    gulp = require('gulp'),
    browsersync = require("browser-sync").create(),
    fileinclude = require("gulp-file-include"),
    del = require("del"),
    scss = require("gulp-sass")(require('sass')),
    autoprefixer = require("gulp-autoprefixer"),
    groupmedia = require("gulp-group-css-media-queries"),
    cleancss = require("gulp-clean-css"),
    rename = require("gulp-rename"),
    uglify = require("gulp-uglify-es").default
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    webphtml = require("gulp-webp-html"),
    webpcss = require("gulp-webpcss"),
    svgsprite = require("gulp-svg-sprite"),
    ttf = require("gulp-ttf2woff"),
    ttf2 = require("gulp-ttf2woff2"),
    fonter = require("gulp-fonter");
    const htmlPartial = require('gulp-html-partial');

function browserSync(){
    browsersync.init({
        server:{
            baseDir: "./" + build_folder + "/"
        },
        port: 3000,
        notify: false
    })
}

function html(){
    return src(path.source.html)
    //.pipe(fileinclude())
    .pipe(htmlPartial({
        basePath: source_folder+"/html/components/"
     }))
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

function css(){
    return src(path.source.css)
    .pipe(scss({
        outputStyle: "expanded"
    }))
    .pipe(groupmedia())
    .pipe(
        autoprefixer({
            overrideBrowserslist: ["last 99 versions"],
            cascade: false
        })
    )
    .pipe(webpcss())
    .pipe(dest(path.build.css))
    .pipe(cleancss())
    .pipe(rename({
        extname: ".min.css"
    }))
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

function scripts(){
    return src(path.source.scripts)
    .pipe(fileinclude())
    .pipe(dest(path.build.scripts))
    .pipe(uglify())
    .pipe(rename({
        extname: ".min.js"
    }))
    .pipe(dest(path.build.scripts))
    .pipe(browsersync.stream())
}

function img(){
    return src(path.source.img)
    .pipe(webp({
        quality: 70
    }))
    .pipe(dest(path.build.img))
    .pipe(src(path.source.img))
    .pipe(
        imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            interlaced: true,
            optimizationLevel: 3
        })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

function fonts(){
    src(path.source.fonts)
    .pipe(ttf())
    .pipe(dest(path.build.fonts))
    return src(path.source.fonts)
    .pipe(ttf2())
    .pipe(dest(path.build.fonts))
}

gulp.task('svgsprite', function(){
    return gulp.src([source_folder + "/img/**/*.svg"])
    .pipe(svgsprite({
        mode: {
            stack: {
                sprite: "../icons/icons.svg"
            }
        }
    }))
    .pipe(dest(path.build.img));
})

gulp.task('otf2ttf', function(){
    return gulp.src([source_folder + "/fonts/**/*.otf"])
    .pipe(fonter({
        formats: ['ttf']
    }))
    .pipe(dest(source_folder + '/fonts/'));
})

function fonts2style(){
    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                    for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb(){

}

function watchFiles(){
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.scripts], scripts);
}

function clean(){
    return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(scripts, css, html, img, fonts));
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fonts = fonts;
exports.img = img;
exports.scripts = scripts;
exports.html = html;
exports.css = css;
exports.build = build;
exports.watch = watch;
exports.default = watch;