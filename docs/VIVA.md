# Viva Questions & Answers

## Q: Why embeddings instead of keyword matching?

**A:** Embeddings capture semantic meaning — "blue backpack" matches "navy rucksack" even without shared words. We keep TF-IDF as fallback for reliability.

## Q: Explain the 40/40/20 scoring.

**A:** Text (OpenAI cosine), image (CLIP cosine), location (haversine normalized). Weights renormalize if image embedding is missing.

## Q: What is the layered architecture?

**A:** Controller handles HTTP, Service has business rules, Repository accesses MongoDB. Easier testing and FYP maintainability.

## Q: How does realtime work?

**A:** Socket.IO joins `user:{id}` for notifications and `conversation:{id}` for chat. HTTP persists messages; socket broadcasts `message:new`.

## Q: Security measures?

**A:** JWT access + refresh, bcrypt passwords, rate limiting, mongo sanitize, helmet, email verification, OTP/password reset, audit logs, admin ban.

## Q: Scalability?

**A:** Redis caching for analytics, Cloudinary CDN, candidate limit (200), async embedding jobs, MongoDB indexes including `2dsphere`.

## Q: Future scope?

**A:** Mobile app, push notifications (FCM), on-device embeddings, multilingual models, institutional SSO, blockchain claim proofs.
