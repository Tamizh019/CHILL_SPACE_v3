import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useChat } from '@/hooks/useChat';
import { useGlobalStore } from '@/context/GlobalStoreContext';

export default function ChatScreen() {
    const route = useRoute<any>();
    const { channelId, userId, name, type } = route.params;
    const { channels, friends, user } = useGlobalStore();
    const flatListRef = useRef<FlatList>(null);

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

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages]);

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
            <View className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'} px-4`}>
                {!isMe && (
                    <View className="w-8 h-8 rounded-full bg-slate-700 mr-2 items-center justify-center border border-slate-600 mt-1">
                        <Text className="text-white text-xs font-bold">{item.username?.[0]?.toUpperCase()}</Text>
                    </View>
                )}
                <View className={`max-w-[80%] p-3.5 rounded-2xl ${isMe
                        ? 'bg-emerald-600 rounded-tr-sm shadow-md'
                        : 'bg-slate-800 rounded-tl-sm border border-slate-700/50'
                    }`}>
                    {!isMe && <Text className="text-emerald-400 text-xs font-bold mb-1 opacity-80">{item.username}</Text>}
                    <Text className="text-white text-base leading-6">{item.content}</Text>
                    <Text className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
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
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            {/* Header Overlay (Transparent) - handled by navigation options usually, but we can customize background */}

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text className="text-slate-400 mt-4 font-medium">Loading chat...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    className="flex-1"
                    contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <View className="p-4 bg-slate-950/90 border-t border-slate-800/50 backdrop-blur-md pb-6">
                <View className="flex-row items-center bg-slate-800/80 rounded-full border border-slate-700 px-1 py-1">
                    <TextInput
                        className="flex-1 text-white p-3 pl-4 max-h-24 text-base"
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={`Message ${type === 'dm' ? ('@' + name) : ('#' + name)}...`}
                        placeholderTextColor="#64748b"
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        className={`w-10 h-10 rounded-full items-center justify-center mr-1 ${inputText.trim() ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                        disabled={!inputText.trim()}
                    >
                        <Text className="text-slate-900 font-bold text-lg">↑</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
