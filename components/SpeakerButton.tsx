import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const SpeakerButton = ({ onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.button}>
        <Icon name="bullhorn" size={24} color="#000" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 50,
    },
});

export default SpeakerButton;
