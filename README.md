# AccentParlez

**한국인을 위한 프랑스어 학습 챗봇 애플리케이션**

AccentParlez는 한국인을 위해 설계된 프랑스어 학습 도우미입니다.\
실시간 AI 기반 대화와 TTS(Text-to-Speech) 기능을 통해 초보자부터 중급자까지 재미있고 효과적으로 프랑스어를 배울 수 있습니다.

---

## 📸 스크린샷

<p align="center">
  <img src="https://raw.githubusercontent.com/tgt5248/AccentParlez/main/images/Splash.png" alt="스플래시 화면" width="30%"  />
  <img src="https://raw.githubusercontent.com/tgt5248/AccentParlez/main/images/Select_Language.png" alt="챗봇 화면" width="30%"/>
  <img src="https://raw.githubusercontent.com/tgt5248/AccentParlez/main/images/Chat.png" alt="TTS 기능 화면" width="30%"/>
</p>

---

## 🚀 주요 기능
- 실시간 AI 대화 연습: Gemini API를 활용한 실시간 프랑스어 대화
- TTS 기능: Play.ht API를 통해 프랑스어 발음을 듣고 학습 가능
- 다양한 난이도 지원: 초보자부터 중급자까지 적합한 학습 경험 제공

---

## 🛠️ 기술 스택
- **Frontend**: React Native
- **PlatForm**: Expo
- **AI**: Gemini API
- **TTS Service**: play.ht API
  
---

## 📦 설치 및 실행
1. **저장소 클론**
2. **의존성 설치**:
   ``` typescript
   npm install
   ```
3. **환경 변수 설정**:\
프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래 내용을 추가합니다:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   PLAYHT_API_KEY=your_playht_api_key_here
   PLAYHT_USER_ID=your_playht_user_id_here
   ```
4. **로컬 서버 실행**:
   ```
   npx expo start
   ```
---

## 📚 사용 방법
1. 앱 실행 후 언어 선택
2. 챗봇과 대화하며 프랑스어 회화 연습.
3. TTS 기능을 통해 발음을 듣고 따라하기.
4. 학습 기록 확인 및 피드백 수집. (기능 구현 예정)

