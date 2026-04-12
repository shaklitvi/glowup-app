# הגדרת Vercel + Hugging Face לـ GlowUp

## צעדים להגדרה מהירה:

### 1. הכנס ל-Vercel
```
https://vercel.com
```
- Sign up עם GitHub
- בחר את הריפו `glowup-app`

### 2. הוסף Environment Variable
כשהפרויקט טוען:
- **Settings** → **Environment Variables**
- הוסף:
  - **Name:** `HUGGING_FACE_API_KEY`
  - **Value:** (Token שקיבלת)
- **Save**

### 3. Deploy
- לחץ **Redeploy** או **Deploy**
- חכה 2-3 דקות

### 4. בדוק שהכל עובד
- היכנס לעמוד
- העלה תמונה
- כתוב: "סופרמן" או "חלל"
- לחץ "עריכה"
- ✨ אמור להיות AI אמיתי!

---

## אם יש שגיאות:

**❌ "Unauthorized"**
- בדוק שה-Token נכון ב-Vercel
- בדוק שה-Token לא פרק מעובד

**❌ "API Error"**
- חכה דקה (Hugging Face עשוי להיות בעומס)
- נסה שוב

---

## חשוב - אבטחה!

**אחרי הגדרה מוצלחת:**
1. היכנס ל-https://huggingface.co/settings/tokens
2. **מחק** את ה-Token הישן
3. **הנפק** Token חדש
4. עדכן ב-Vercel

---

## קבועים בקוד:
- Model: `timbrooks/instruct-pix2pix` (Hugging Face)
- API: `/api/edit-image` (Vercel Serverless)
- טכנולוגיה: Node.js 18+
