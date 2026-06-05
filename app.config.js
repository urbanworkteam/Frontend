// EAS 클라우드 빌드에서는 google-services.json 이 git 에 없으므로
// EAS 파일 환경변수(GOOGLE_SERVICES_JSON)로 주입받는다.
// 로컬에서는 기존 ./google-services.json 을 그대로 사용한다.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
});
