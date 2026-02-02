import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useChat } from '@/hooks/useChat';
import { useGlobalStore } from '@/context/GlobalStoreContext';

export default function ChatScreen() {
    const route = useRoute<any>();
    const { channelId, userId, type } = route.params;
    const { channels, friends, user } = useGlobalStore();
    const {
        messages,
        sendMessage,
        sendDirectMessage,
        isLoading,
        setCurrentChannel,
        setRecipient,
    } = useChat();

    const [inputText, setInputText] = useState('');

    // Set Context on Mount
    useEffect(() => {
        if (type === 'dm') {
            const friend = friends.find(f => f.id === userId);
            setRecipient(friend || null);
            setCurrentChannel(null); // Clear channel
        } else {
            const channel = channels.find(c => c.id === channelId);
            setCurrentChannel(channel || null);
            setRecipient(null); // Clear recipient
        }
    }, [channelId, userId, type, channels, friends]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        if (type === 'dm') {
            sendDirectMessage(inputText);
        } else {
            sendMessage(inputText);
        }
        setInputText('');
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.user_id === user?.id;
        return (
            <View className={`mb-3 flex-row ${isMe ? 'justify-end' : 'justify-start'} px-4`}>
                {!isMe && (
                    <View className="w-8 h-8 rounded-full bg-slate-700 mr-2 items-center justify-center">
                        <Text className="text-white text-xs">{item.username?.[0]}</Text>
                    </View>
                )}
                <View className={`max-w-[80%] p-3 rounded-2xl ${isMe
                        ? 'bg-emerald-600 rounded-tr-none'
                        : 'bg-slate-800 rounded-tl-none'
                    }`}>
                    {!isMe && <Text className="text-emerald-400 text-xs font-bold mb-1">{item.username}</Text>}
                    <Text className="text-white text-base leading-5">{item.content}</Text>
                    <Text className="text-slate-400 text-[10px] mt-1 self-end">
                        {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-slate-950"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            ) : (
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    className="flex-1 pt-4"
                    inverted={false} // useChat sorts ascending. But usually chat needs inverted list or scroll to bottom.
                    // For now, let's keep ascending and stick to bottom if possible, or just standard list
                    // useChat returns ascending (oldest first).
                    // We should stick to bottom ideally.
                    onContentSizeChange={() => {
                        // Scrolling to end handled by ref usually
                    }}
                />
            )}

            <View className="p-3 bg-slate-900 border-t border-slate-800 flex-row items-center">
                <TextInput
                    className="flex-1 bg-slate-950 text-white p-3 rounded-full border border-slate-700 mr-2 max-h-24"
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Message..."
                    placeholderTextColor="#64748b"
                    multiline
                />
                <TouchableOpacity
                    onPress={handleSend}
                    className="bg-emerald-500 w-10 h-10 rounded-full items-center justify-center"
                >
                    <Text className="text-slate-900 font-bold">→</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
