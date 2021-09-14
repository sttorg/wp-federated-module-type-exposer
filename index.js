const tar = require("tar");
const { rename } = require("fs");
const { join } = require("path");
const { promisify } = require("util");
const renameAsync = promisify(rename);
class WebpackFederatedModuleTypeExposer {
  constructor(options) {
    this.options = options;
  }
  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      "WebpackFederatedModuleTypeExposer",
      (compilation, callback) => {
        const { name, exposes } = this.options;
        const { assets, options, compiler } = compilation;
        const { outputPath } = compiler;
        const { output } = options;

        Object.keys(exposes).forEach((expose) => {
          const expName = expose.substring(2);
          const dts = `${exposes[expose].substring(2)}.d.ts`;
          compilation.emitAsset(`./${name}/${expName}.d.ts`, assets[dts]);
        });

        const tgzName = `${name}.tgz`;
        tar
          .c(
            {
              gzip: true,
              file: tgzName,
              cwd: outputPath,
            },
            [name]
          )
          .then(() =>
            renameAsync(
              tgzName,
              join(options.context, output.publicPath, tgzName)
            )
          )
          .then(callback);
      }
    );
  }
}

module.exports = WebpackFederatedModuleTypeExposer;
