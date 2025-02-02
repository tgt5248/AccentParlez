import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 네비게이션 스택 타입 정의
type RootStackParamList = {
    LanguageSelection: undefined;
    Chat: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'LanguageSelection'>;

const LanguageSelectionScreen: React.FC<Props> = ({ navigation }) => {
    const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);
    const [learningLanguage, setLearningLanguage] = useState<string | null>(null);

    const handleNext = async () => {
        if (!currentLanguage || !learningLanguage) {
            Alert.alert('알림', '모든 언어를 선택해주세요!');
            return;
        }

        try {
            // AsyncStorage에 언어 선택 여부 저장
            await AsyncStorage.setItem('hasSelectedLanguage', 'true');
            await AsyncStorage.setItem('currentLanguage', currentLanguage);
            await AsyncStorage.setItem('learningLanguage', learningLanguage);

            navigation.navigate('Chat'); // 채팅 화면으로 이동
        } catch (e) {
            console.error('Error saving language selection:', e);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>언어 선택</Text>

            {/* 현재 사용하는 언어 */}
            <Text style={styles.label}>현재 사용하는 언어</Text>
            <RNPickerSelect
                onValueChange={(value) => setCurrentLanguage(value)}
                items={[
                    { label: '한국어', value: 'korean' },
                ]}
                placeholder={{
                    label: '언어를 선택하세요',
                    value: '',
                }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
            />

            {/* 배우고 싶은 언어 */}
            <Text style={styles.label}>배우고 싶은 언어</Text>
            <RNPickerSelect
                onValueChange={(value) => setLearningLanguage(value)}
                items={[
                    { label: '프랑스어', value: 'french' },
                ]}
                placeholder={{
                    label: '언어를 선택하세요',
                    value: '',
                }}
                style={pickerSelectStyles}
                useNativeAndroidPickerStyle={false}
            />

            {/* 다음 버튼 */}
            <View style={styles.buttonContainer}>
                <Button title="다음" onPress={handleNext} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
        marginTop: 20,
    },
    buttonContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
});

const pickerSelectStyles = {
    inputIOSContainer: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        backgroundColor: '#fff',
        fontSize: 16,
        color: 'black',
    },
};

export default LanguageSelectionScreen;
