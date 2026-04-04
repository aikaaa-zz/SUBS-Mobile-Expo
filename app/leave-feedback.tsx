import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, ThumbsUp, ThumbsDown, Send } from 'lucide-react-native';
import Header from '../components/Header';
import { feedbackAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Colors, FontSize, FontWeight, BorderRadius, Shadows } from '../constants/theme';

export default function LeaveFeedbackScreen() {
  const { websiteId, websiteName, bookingId } = useLocalSearchParams<{
    websiteId: string; websiteName: string; bookingId: string;
  }>();
  const router = useRouter();
  const { session } = useAuth();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await feedbackAPI.submitFeedback({
        userId: session?.userId,
        websiteId,
        bookingId,
        rating,
        comment,
        wouldRecommend,
      });
      Alert.alert('Thank You!', 'Your feedback has been submitted.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.page}>
      <Header title="Leave Feedback" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.businessName}>{websiteName}</Text>
        <Text style={styles.subtitle}>How was your experience?</Text>

        {/* Star Rating */}
        <View style={styles.section}>
          <Text style={styles.label}>Overall Rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(s => (
              <TouchableOpacity key={s} onPress={() => setRating(s)}>
                <Star
                  size={40}
                  color="#f59e0b"
                  fill={s <= rating ? '#f59e0b' : 'none'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </Text>
          )}
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.label}>Your Review (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Would Recommend */}
        <View style={styles.section}>
          <Text style={styles.label}>Would you recommend this business?</Text>
          <View style={styles.recommendRow}>
            <TouchableOpacity
              style={[styles.recommendBtn, wouldRecommend === true && styles.recommendYes]}
              onPress={() => setWouldRecommend(true)}
            >
              <ThumbsUp size={20} color={wouldRecommend === true ? '#fff' : Colors.successGreen} />
              <Text style={[styles.recommendText, wouldRecommend === true && { color: '#fff' }]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.recommendBtn, wouldRecommend === false && styles.recommendNo]}
              onPress={() => setWouldRecommend(false)}
            >
              <ThumbsDown size={20} color={wouldRecommend === false ? '#fff' : Colors.errorRed} />
              <Text style={[styles.recommendText, wouldRecommend === false && { color: '#fff' }]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <><Send size={20} color="#fff" /><Text style={styles.submitText}>Submit Feedback</Text></>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: 20 },
  businessName: { fontSize: FontSize.xxl, fontFamily: 'Inter_700Bold', color: Colors.textDark, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, fontFamily: 'Inter_400Regular', color: Colors.textMuted, marginBottom: 24 },
  section: { backgroundColor: Colors.bgWhite, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 16, ...Shadows.sm },
  label: { fontSize: FontSize.md, fontFamily: 'Inter_600SemiBold', color: Colors.textDark, marginBottom: 12 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  ratingLabel: { fontSize: FontSize.md, fontFamily: 'Inter_600SemiBold', color: '#f59e0b', textAlign: 'center' },
  textArea: { backgroundColor: Colors.bgLight, borderWidth: 1, borderColor: Colors.borderColor, borderRadius: BorderRadius.md, padding: 12, fontSize: FontSize.md, fontFamily: 'Inter_400Regular', color: Colors.textDark, minHeight: 100 },
  recommendRow: { flexDirection: 'row', gap: 12 },
  recommendBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderColor },
  recommendYes: { backgroundColor: Colors.successGreen, borderColor: Colors.successGreen },
  recommendNo: { backgroundColor: Colors.errorRed, borderColor: Colors.errorRed },
  recommendText: { fontSize: FontSize.md, fontFamily: 'Inter_600SemiBold', color: Colors.textDark },
  submitBtn: { flexDirection: 'row', backgroundColor: Colors.primaryOrange, borderRadius: BorderRadius.lg, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  submitText: { color: '#fff', fontSize: FontSize.xl, fontFamily: 'Inter_700Bold' },
});