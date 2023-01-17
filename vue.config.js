module.exports = {
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                productName: "DataBahn",
                appId: 'test.com',
                //win 설치옵션 테스트 완료
                win: {
                    "target": ["nsis"],
                    icon: 'public/icon.png',
                    // publish:
                    //     -bitbucket
                    //     -github
                    //"requestedExecutionLevel": "requireAdministrator"
                },
                "nsis": {
                    "installerIcon": "public/icon.ico",
                    "uninstallerIcon": "public/icon.ico",
                    //"uninstallDisplayName": "CPU Monitor",
                    "oneClick": false,
                    //dir위치변경
                    "allowToChangeInstallationDirectory": true,
                    "createDesktopShortcut": true,
                    //"createStartMenuShortcut": true
                },

                //mac 설치옵션 테스트 불가
                mac: {
                    "target": ["pkg"],
                    "icon": 'public/icon.icns',
                },
                "pkg": {
                    "allowAnywhere": true,
                },
                publish: ["bitbucket", "github"]
            },

        }
    }
}