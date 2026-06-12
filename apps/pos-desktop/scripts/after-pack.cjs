const path = require("node:path");
const rcedit = require("rcedit");

module.exports = async function applyWindowsMetadata(context) {
  if (context.electronPlatformName !== "win32") return;

  const exePath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.exe`,
  );
  const iconPath = path.join(__dirname, "..", "assets", "restrozapp.ico");
  const version = context.packager.appInfo.version;

  await rcedit(exePath, {
    icon: iconPath,
    "file-version": version,
    "product-version": version,
    "version-string": {
      CompanyName: "RestroZapp",
      FileDescription: "RestroZapp POS",
      InternalName: "RestroZapp POS",
      LegalCopyright: `Copyright ${new Date().getFullYear()} RestroZapp`,
      OriginalFilename: "RestroZapp POS.exe",
      ProductName: "RestroZapp POS",
    },
  });
};
