import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
// import { useNavigation } from '@react-navigation/native'; // Not needed if App.tsx handles switching

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: email.split('@')[0], // Default username
                }
            }
        });

        if (error) Alert.alert('Error', error.message);
        else Alert.alert('Success', 'Check your inbox for email verification!');
        setLoading(false);
    }

    return (
        <View className="flex-1 justify-center items-center bg-slate-900 p-4">
            <View className="w-full max-w-sm">
                <Text className="text-3xl font-bold text-white mb-8 text-center ml-2">
                    Chill Space
                    <Text className="text-emerald-400"> V3</Text>
                </Text>

                <View className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                    <Text className="text-xl text-white font-semibold mb-6">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </Text>

                    <View className="mb-4">
                        <Text className="text-slate-400 mb-2 text-sm ml-1">Email</Text>
                        <TextInput
                            className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700 focus:border-emerald-500"
                            placeholder="email@address.com"
                            placeholderTextColor="#64748b"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-slate-400 mb-2 text-sm ml-1">Password</Text>
                        <TextInput
                            className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700 focus:border-emerald-500"
                            placeholder="Password"
                            placeholderTextColor="#64748b"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={true}
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity
                        className={`bg-emerald-500 p-4 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}
                        disabled={loading}
                        onPress={isLogin ? signInWithEmail : signUpWithEmail}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-slate-900 font-bold text-lg">
                                {isLogin ? 'Sign In' : 'Sign Up'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View className="mt-6 flex-row justify-center">
                        <Text className="text-slate-400">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </Text>
                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                            <Text className="text-emerald-400 font-bold">
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}
