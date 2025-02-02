import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    FlatList,
    KeyboardAvoidingView,
    Keyboard,
    TouchableWithoutFeedback,
    TouchableOpacity,
    Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard'; // Expo
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';
import { playTextToSpeech } from '../utils/playAudio';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    time: string;
    isError?: boolean; // 에러 여부를 나타내는 필드
};

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const generateGreeting = () => {
    const currentHour = new Date().getHours();

    if (5 <= currentHour && currentHour < 12) {
        return "좋은 아침이에요! 저는 프랑스어 선생님 'Prof. Sophie Rousseau'입니다.\n\n오늘도 프랑스어를 재미있게 배워봐요!";
    } else if (12 <= currentHour && currentHour < 18) {
        return "안녕하세요! 저는 프랑스어 선생님 'Prof. Sophie Rousseau'입니다.\n\n프랑스어에 대해 궁금한 점이 있으면 언제든 물어보세요!";
    } else {
        return "좋은 저녁이에요! 저는 프랑스어 선생님 'Prof. Sophie Rousseau'입니다.\n\n오늘도 프랑스어를 함께 배워볼까요?";
    }
};

const ChatScreen = () => {
    const [messages, setMessages] = useState<Message[]>([{
        id: Date.now().toString(),
        text: generateGreeting(),
        sender: 'ai',
        time: new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        }),
        isError: false,
    }]);
    const [inputText, setInputText] = useState('안녕');
    const [model, setModel] = useState<any>(null);
    const [conversationHistory, setConversationHistory] = useState<string[]>([]); // 대화 히스토리 상태
    const flatListRef = useRef<FlatList>(null);
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

    // 키보드 이벤트 리스너 등록
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', handleKeyboardWillShow);
        return () => keyboardWillShowListener.remove();
    }, []);

    const handleKeyboardWillShow = (event) => {
        const keyboardAnimationDuration = event.duration || 250;
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), keyboardAnimationDuration);
    };

    useEffect(() => {
        const initializeModel = async () => {
            try {
                const initializedModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                setModel(initializedModel);
            } catch (error) {
                console.log('Error initializing model:', error);
            }
        };

        initializeModel();
    }, []);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        setIsLoading(true);
        const currentTime = new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            time: currentTime,
        };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setConversationHistory((prevHistory) => [
            ...prevHistory,
            `User: ${inputText}`,
        ]);
        setInputText('');

        try {
            if (!model) throw new Error('Model is not initialized yet.');

            const aiResponse = await getAIResponse(inputText);

            const aiMessage: Message = {
                id: Date.now().toString(),
                text: aiResponse,
                sender: 'ai',
                time: currentTime,
                isError: false,
            };
            setMessages((prevMessages) => [...prevMessages, aiMessage]);
            setConversationHistory((prevHistory) => [
                ...prevHistory,
                `AI: ${aiResponse}`,
            ]);
        } catch (error) {
            const errorMessage: Message = {
                id: Date.now().toString(),
                text: error.message || '죄송합니다. 답변을 가져올 수 없습니다.',
                sender: 'ai',
                time: currentTime,
                isError: true,
            };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };


    const getAIResponse = async (userInput) => {
        try {
            // 프롬프트와 기존 대화 히스토리 결합
            const prompt = [
                "너는 한국인 학생들에게 프랑스어를 가르치는 선생님 'Prof. Sophie Rousseau'야.",
                "대화는 주로 한국어로 진행하며, 필요할 때만 프랑스어 예제와 설명을 제공해.",
                "프랑스어 단어와 뜻만 알려주되, 발음(괄호 안에 표기)은 포함하지 마.",
                "응답은 간결하고 명확하게 작성하며, 최대 3문장으로 제공해.",
                "각 문장에서 줄바꿈(개행)을 추가하여 가독성을 높여.",
                "사용자가 질문한 주제와 관련된 다른 표현이나 유용한 예제를 추가로 추천해.",
                "사용자가 프랑스어로 질문한다면, 문법과 표현이 맞는지 확인 후 프랑스어로 답변해.",
                "학생의 수준(초급, 중급, 고급)에 따라 난이도를 조절해 설명해.",
                "학습을 단계적으로 진행하되, 필요하면 즉시 연습하거나 다음 주제를 연결해서 설명해.",
                "질문이 모호하거나 불완전하다면, 명확히 하기 위해 추가 질문을 제안해.",
                "사용자가 특정 단어나 표현을 물어볼 경우, 사전적 정의나 일반적인 설명 대신 프랑스어로 해당 단어를 바로 제공해.",
                "학생이 학습 동기를 유지할 수 있도록 친근하고 격려하는 어조를 사용해.",
                "사용자가 추가적인 설명을 요청하지 않는 한, 불필요한 정보나 학습 계획(예: '다음 시간')을 언급하지 마.",
                ...conversationHistory, // 이전 대화 히스토리 포함
                `User: ${userInput}`, // 현재 사용자 입력 추가
            ];

            const result = await model.generateContent(prompt.join('\n'), {
                maxOutputTokens: 100, // 최대 토큰 수 제한
                temperature: 0.7, // 응답의 다양성 조정
            });

            let responseText = result.response.text();

            // 개행된 텍스트를 그대로 반환
            return responseText.trim();
        } catch (error) {
            console.log('Error fetching AI response in AI Response:', error.message || error);
            throw new Error('죄송합니다. 답변을 가져올 수 없습니다.'); // 에러를 명시적으로 던짐
        }
    };

    const retryAIRequest = async (messageText: string) => {
        try {
            const aiResponse = await getAIResponse(messageText);

            const currentTime = new Date().toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
            });

            const aiMessage: Message = {
                id: Date.now().toString(),
                text: aiResponse,
                sender: 'ai',
                time: currentTime,
                isError: false, // 재요청 성공 시 isError를 false로 설정
            };

            // 기존 에러 메시지를 성공 메시지로 대체
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.text === messageText && msg.isError ? aiMessage : msg
                )
            );
        } catch (error) {
            console.log('Retry failed:', error);
        }
    };

    // 메시지 복사 함수
    const handleCopyMessage = async (text: string) => {
        await Clipboard.setStringAsync(text); // 클립보드에 텍스트 저장
        Alert.alert('메시지 복사', '메시지가 클립보드에 복사되었습니다.');
    };

    const handlePlayTTS = (text: string) => {
        let language: 'korean' | 'english' | 'french' = 'korean';

        if (/^[A-Za-z\s]+$/.test(text)) {
            language = 'english'; // 영어만 포함된 경우
        } else if (/[\uAC00-\uD7A3]/.test(text)) {
            language = 'korean'; // 한글이 포함된 경우
        } else if (/[éèêàâôûçî]/.test(text)) {
            language = 'french'; // 프랑스어 특수문자가 포함된 경우
        }

        playTextToSpeech(text, 'french');
    };

    // 메시지 렌더링 함수 수정
    const renderMessageItem = ({ item }: { item: Message }) => (
        <TouchableOpacity
            onLongPress={() => handleCopyMessage(item.text)} // 길게 눌렀을 때 복사
            activeOpacity={0.7}
        >
            <View
                style={[
                    styles.messageContainer,
                    item.sender === 'user' ? styles.userMessage : styles.aiMessage,
                ]}
            >
                <Text style={styles.messageText}>{item.text}</Text>
                <TouchableOpacity onPress={() => handlePlayTTS(item.text)}>
                    <Text style={styles.speakerIcon}>🔊</Text>
                </TouchableOpacity>

                <Text style={styles.messageTime}>{item.time}</Text>
                {item.isError ? (
                    <TouchableOpacity
                        onPress={() => retryAIRequest(item.text)}
                        style={styles.retryButton}
                    >
                        <Text style={styles.retryButtonText}>새로고침</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </TouchableOpacity>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior="padding"
                keyboardVerticalOffset={90}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[styles.chatContainer, { flexGrow: 1 }]}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
                <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    {isLoading && <Text>AI 응답을 기다리는 중...</Text>}
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="메시지를 입력하세요"
                        returnKeyType="send"
                        multiline={true}
                        scrollEnabled={true}
                    />
                    <Button title="전송" onPress={handleSend} disabled={isLoading} />
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    chatContainer: {
        flexGrow: 1,
        paddingVertical: 10,
    },
    messageContainer: {
        marginVertical: 5,
        marginHorizontal: 10,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        maxWidth: '80%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#DCF8C6',
    },
    aiMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8E8E8',
    },
    messageText: {
        fontSize: 16,
        color: '#333',
    },
    messageTime: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: "#ccc",
    },
    input: {
        flex: 1,
        height: 40,
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginRight: 10
    },
    retryButton: {
        marginTop: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#FF6347',
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
    },
    speakerIcon: {
        fontSize: 20,
    },
});

export default ChatScreen;
