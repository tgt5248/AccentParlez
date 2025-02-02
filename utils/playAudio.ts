// import Sound from 'react-native-sound'; // 폰에서 안됨
// import { PLAYHT_API_KEY, PLAYHT_USER_ID } from '@env';

// // PlayHT v2 API에서 사용할 수 있는 프랑스어 음성 ID
// const VOICE_IDS = {
//     korean: 's3://voice-cloning-zero-shot/.../manifest.json', // PlayHT 전용 한국어 음성 (예시)
//     english: 'larry', // PlayHT 전용 영어 음성 (예시)
//     french: 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json', // PlayHT 전용 프랑스어 음성
// };

// export const playTextToSpeech = async (text: string, language: 'korean' | 'english' | 'french') => {
//     try {
//         // Play.ht API 호출 옵션
//         const options = {
//             method: 'POST',
//             headers: {
//                 accept: 'audio/mpeg', // 오디오 스트림 형식
//                 'content-type': 'application/json',
//                 Authorization: `Bearer ${PLAYHT_API_KEY}`, // 환경 변수에서 API 키 가져오기
//                 'X-User-ID': PLAYHT_USER_ID, // 환경 변수에서 사용자 ID 가져오기
//             },
//             body: JSON.stringify({
//                 text, // 변환할 텍스트
//                 voice: VOICE_IDS.french, // 선택된 언어의 PlayHT 전용 음성 ID
//                 output_format: 'mp3', // 출력 형식
//                 voice_engine: 'PlayHT2.0', // PlayHT v2 엔진 사용
//             }),
//         };

//         const response = await fetch('https://api.play.ht/api/v2/tts/stream', options);

//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`TTS 변환 실패 (${response.status}): ${errorText}`);
//         }

//         // Play.ht API는 오디오 스트림을 반환하므로 URL로 직접 접근 가능
//         const audioUrl = response.url;

//         if (!audioUrl) {
//             throw new Error('오디오 URL을 가져오지 못했습니다.');
//         }

//         // 오디오 재생
//         const sound = new Sound(audioUrl, '', (error) => {
//             if (error) {
//                 console.error('오디오 로드 실패:', error);
//                 return;
//             }

//             // 오디오 재생
//             sound.play((success) => {
//                 if (success) {
//                     console.log('재생 완료');
//                 } else {
//                     console.error('재생 중 오류 발생');
//                 }

//                 // 리소스 해제
//                 sound.release();
//             });
//         });
//     } catch (error) {
//         console.error('TTS 오류:', error);
//     }
// };

import { Audio } from 'expo-av';
import { PLAYHT_API_KEY, PLAYHT_USER_ID } from '@env';

type LanguageKey = 'korean' | 'english' | 'french';
type VoiceIds = Record<LanguageKey, string>;

const VOICE_IDS: VoiceIds = {
    korean: 's3://voice-cloning-zero-shot/.../manifest.json',
    english: 'larry',
    french: 's3://voice-cloning-zero-shot/1d26f4fe-1d08-4cfe-a7c1-d28e4e913ff9/original/manifest.json',
};

let soundInstance: Audio.Sound | null = null;

export const playTextToSpeech = async (
    text: string,
    language: LanguageKey = 'french'
): Promise<void> => {
    console.log('[1] 함수 진입 - 텍스트 길이:', text.length);

    try {
        console.log('[2] API 요청 시작');
        const createResponse = await fetch('https://api.play.ht/api/v2/tts', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PLAYHT_API_KEY}`,
                'X-User-ID': PLAYHT_USER_ID,
                'Content-Type': 'application/json',
                Accept: 'application/json', // JSON 응답 강제
            },
            body: JSON.stringify({
                text,
                voice: 's3://voice-cloning-zero-shot/1d26f4fe-1d08-4cfe-a7c1-d28e4e913ff9/original/manifest.json',
                voice_engine: 'PlayHT2.0',
                output_format: 'mp3',
            }),
        });

        console.log('[3] fetch 요청 완료 - 상태 코드:', createResponse.status);

        // [추가] 응답 헤더 확인
        const contentType = createResponse.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const rawResponse = await createResponse.text();
            console.error('잘못된 응답 형식:', rawResponse.substring(0, 300));
            throw new Error('서버가 JSON 형식으로 응답하지 않았습니다.');
        }

        // [수정] 안전한 JSON 파싱
        let createData;
        try {
            const responseText = await createResponse.text();
            createData = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('JSON 파싱 실패:', jsonError);
            const rawResponse = await createResponse.text();
            console.error('원본 응답:', rawResponse);
            throw new Error(`JSON 파싱 실패: ${rawResponse.substring(0, 100)}`);
        }

        // 작업 ID 추출
        console.log(createData, 'cD')
        const jobId = createData.id;
        if (!jobId) throw new Error('작업 ID를 찾을 수 없습니다.');

        console.log('[4] 작업 ID 확인:', jobId);

        // 작업 상태 폴링
        let audioUrl: string | null = null;
        let retryCount = 0;
        const maxRetries = 30; // 최대 30초 대기

        while (retryCount < maxRetries) {
            console.log(`[5] 작업 상태 확인 시도 (${retryCount + 1}/${maxRetries})`);
            const statusResponse = await fetch(`https://api.play.ht/api/v2/tts/${jobId}`, {
                headers: {
                    Authorization: `Bearer ${PLAYHT_API_KEY}`,
                    'X-User-ID': PLAYHT_USER_ID,
                },
            });

            if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                throw new Error(`상태 확인 실패 (${statusResponse.status}): ${errorText}`);
            }

            const statusData = await statusResponse.json();
            console.log('[6] 상태 응답:', statusData);

            if (statusData.status === 'complete' && statusData.output?.url) {
                audioUrl = statusData.output.url;
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
            retryCount++;
        }

        if (!audioUrl) throw new Error('오디오 URL을 얻지 못했습니다.');

        console.log('[7] 오디오 URL 확인:', audioUrl);

        // 기존 사운드 정리
        if (soundInstance) {
            await soundInstance.unloadAsync();
            soundInstance = null;
        }

        // 오디오 재생
        console.log('[8] 오디오 재생 시작');
        const { sound } = await Audio.Sound.createAsync(
            { uri: audioUrl },
            { shouldPlay: true }
        );

        soundInstance = sound;

        // 재생 상태 업데이트
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync().then(() => {
                    soundInstance = null;
                    console.log('[9] 오디오 재생 완료');
                });
            }
        });

    } catch (error) {
        console.error('[최종 에러]', error);
        throw error;
    }
};

// 재생 중지 함수
export const stopSpeech = async (): Promise<void> => {
    if (soundInstance) {
        await soundInstance.stopAsync();
        await soundInstance.unloadAsync();
        soundInstance = null;
    }
};
