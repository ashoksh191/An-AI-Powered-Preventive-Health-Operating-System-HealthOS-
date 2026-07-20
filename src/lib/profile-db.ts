import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

/**
 * Returns a lazily-initialized Prisma client.
 */
export function getPrismaClient(): PrismaClient | null {
  const dbUrl = process.env.DATABASE_URL;
  if (
    !dbUrl || 
    dbUrl.includes('your-project') || 
    dbUrl.includes('postgresql://user:password') ||
    (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://'))
  ) {
    return null; // Return null to flag that we should use the in-memory fallback
  }

  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }
  return prismaInstance;
}

// ========================================================
// IN-MEMORY DATABASE FALLBACK LAYER
// ========================================================
// Keeps development running in the sandboxed preview even if PostgreSQL is not provisioned on GCP yet.

interface InMemUser {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemHealthProfile {
  id: number;
  userId: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  bmi: number;
  sleep: number;
  exercise: number;
  smoking: boolean;
  alcohol: string;
  waterIntake: number;
  stress: string;
  familyHistory: string;
  existingConditions: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemStore {
  id: number;
  userId: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemPrediction {
  id: number;
  userId: string;
  age: number;
  bmi: number;
  sleep: number;
  exercise: number;
  smoking: boolean;
  alcohol: string;
  stress: string;
  familyHistory: string;
  existingConditions: string;
  results: string;
  createdAt: Date;
}

interface InMemHealthScore {
  id: number;
  userId: string;
  sleep: number;
  exercise: number;
  diet: string;
  water: number;
  stress: string;
  bmi: number;
  score: number;
  breakdown: string; // JSON string representing breakdown
  createdAt: Date;
}

const inMemoryUsers = new Map<string, InMemUser>();
const inMemoryProfiles = new Map<string, InMemHealthProfile>();
const inMemoryStores = new Map<string, InMemStore>();
const inMemoryPredictions: InMemPrediction[] = [];
const inMemoryHealthScores: InMemHealthScore[] = [];

interface InMemLifestylePlan {
  id: number;
  userId: string;
  mealPlan: string;
  workoutPlan: string;
  waterGoal: number;
  sleepSchedule: string;
  stressTips: string;
  goals?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const inMemoryLifestylePlans = new Map<string, InMemLifestylePlan>();

interface InMemDailyLog {
  id: number;
  userId: string;
  weight: number;
  sleep: number;
  exercise: number;
  createdAt: Date;
}

const inMemoryDailyLogs: InMemDailyLog[] = [];

interface InMemDailyHealthLog {
  id: number;
  userId: string;
  weight: number;
  sleep: number;
  exercise: number;
  water: number;
  meals: string;
  mood: string;
  createdAt: Date;
  updatedAt: Date;
}

const inMemoryDailyHealthLogs: InMemDailyHealthLog[] = [];

interface InMemChatMessage {
  id: number;
  userId: string;
  role: string;
  content: string;
  createdAt: Date;
}

const inMemoryChatMessages: InMemChatMessage[] = [];

interface InMemNotification {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const inMemoryNotifications: InMemNotification[] = [];

interface InMemReport {
  id: number;
  userId: string;
  type: string;
  title: string;
  content: string;
  createdAt: Date;
}

const inMemoryReports: InMemReport[] = [];

let profileIdCounter = 1;
let storeIdCounter = 1;
let predictionIdCounter = 1;
let healthScoreIdCounter = 1;
let lifestylePlanIdCounter = 1;
let dailyLogIdCounter = 1;
let dailyHealthLogIdCounter = 1;
let chatMessageIdCounter = 1;
let notificationIdCounter = 1;
let reportIdCounter = 1;

// ========================================================
// DATABASE OPERATIONS REPOSITORY
// ========================================================

/**
 * Calculates BMI from weight (kg) and height (cm).
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightMeters = heightCm / 100;
  const bmiValue = weightKg / (heightMeters * heightMeters);
  return Math.round(bmiValue * 10) / 10; // Round to 1 decimal place
}

/**
 * Ensures a user exists in the database.
 */
export async function getOrCreateUser(id: string, email: string) {
  const prisma = getPrismaClient();
  const targetRole = email.toLowerCase() === 'asharofficial10@gmail.com' ? 'admin' : 'user';

  if (prisma) {
    try {
      return await prisma.user.upsert({
        where: { id },
        update: { email, role: targetRole },
        create: { id, email, role: targetRole },
      });
    } catch (err) {
      console.error('Prisma Error in getOrCreateUser:', err);
      throw new Error('Database query failed while synchronizing user profile.', { cause: err });
    }
  }

  // In-Memory fallback
  let user = inMemoryUsers.get(id);
  if (!user) {
    user = {
      id,
      email,
      role: targetRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryUsers.set(id, user);
  } else {
    user.email = email;
    user.role = targetRole;
  }
  return user;
}

/**
 * Retrieves the health profile for a specific user.
 */
export async function getHealthProfile(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.healthProfile.findUnique({
        where: { userId },
      });
    } catch (err) {
      console.error('Prisma Error in getHealthProfile:', err);
      throw new Error('Database query failed while retrieving health profile.', { cause: err });
    }
  }

  // In-Memory fallback
  return inMemoryProfiles.get(userId) || null;
}

/**
 * Creates a health profile for a user.
 */
export async function createHealthProfile(userId: string, data: {
  age: number;
  gender: string;
  height: number;
  weight: number;
  sleep: number;
  exercise: number;
  smoking: boolean;
  alcohol: string;
  waterIntake: number;
  stress: string;
  familyHistory: string;
  existingConditions: string;
}) {
  const bmiValue = calculateBMI(data.weight, data.height);
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.healthProfile.create({
        data: {
          userId,
          ...data,
          bmi: bmiValue,
        },
      });
    } catch (err: any) {
      console.error('Prisma Error in createHealthProfile:', err);
      if (err.code === 'P2002') {
        throw new Error('A health profile already exists for this user. Use PATCH or PUT to update instead.');
      }
      throw new Error('Database query failed while creating health profile.', { cause: err });
    }
  }

  // In-Memory fallback
  if (inMemoryProfiles.has(userId)) {
    throw new Error('A health profile already exists for this user. Use PATCH or PUT to update instead.');
  }

  const newProfile: InMemHealthProfile = {
    id: profileIdCounter++,
    userId,
    ...data,
    bmi: bmiValue,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryProfiles.set(userId, newProfile);
  return newProfile;
}

/**
 * Updates an existing health profile for a user.
 */
export async function updateHealthProfile(userId: string, data: Partial<{
  age: number;
  gender: string;
  height: number;
  weight: number;
  sleep: number;
  exercise: number;
  smoking: boolean;
  alcohol: string;
  waterIntake: number;
  stress: string;
  familyHistory: string;
  existingConditions: string;
}>) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      // Fetch existing to handle BMI calculation if weight or height is updated
      const existing = await prisma.healthProfile.findUnique({ where: { userId } });
      if (!existing) {
        throw new Error('No existing health profile found to update. Please create a profile first.');
      }

      const finalHeight = data.height !== undefined ? data.height : existing.height;
      const finalWeight = data.weight !== undefined ? data.weight : existing.weight;
      const bmiValue = calculateBMI(finalWeight, finalHeight);

      return await prisma.healthProfile.update({
        where: { userId },
        data: {
          ...data,
          bmi: bmiValue,
        },
      });
    } catch (err: any) {
      console.error('Prisma Error in updateHealthProfile:', err);
      if (err.message?.includes('No existing health profile found')) {
        throw err;
      }
      throw new Error('Database query failed while updating health profile.', { cause: err });
    }
  }

  // In-Memory fallback
  const existing = inMemoryProfiles.get(userId);
  if (!existing) {
    throw new Error('No existing health profile found to update. Please create a profile first.');
  }

  const finalHeight = data.height !== undefined ? data.height : existing.height;
  const finalWeight = data.weight !== undefined ? data.weight : existing.weight;
  const bmiValue = calculateBMI(finalWeight, finalHeight);

  const updatedProfile: InMemHealthProfile = {
    ...existing,
    ...data,
    bmi: bmiValue,
    updatedAt: new Date(),
  };

  inMemoryProfiles.set(userId, updatedProfile);
  return updatedProfile;
}

/**
 * Generic key-value store operations for a user (Store table)
 */
export async function setStoreValue(userId: string, key: string, value: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.store.upsert({
        where: {
          userId_key: { userId, key },
        },
        update: { value },
        create: { userId, key, value },
      });
    } catch (err) {
      console.error('Prisma Error in setStoreValue:', err);
      throw new Error('Database query failed while writing key-value store.', { cause: err });
    }
  }

  // In-Memory fallback
  const compoundKey = `${userId}:${key}`;
  let storeItem = inMemoryStores.get(compoundKey);

  if (storeItem) {
    storeItem.value = value;
    storeItem.updatedAt = new Date();
  } else {
    storeItem = {
      id: storeIdCounter++,
      userId,
      key,
      value,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStores.set(compoundKey, storeItem);
  }

  return storeItem;
}

export async function getStoreValue(userId: string, key: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.store.findUnique({
        where: {
          userId_key: { userId, key },
        },
      });
    } catch (err) {
      console.error('Prisma Error in getStoreValue:', err);
      throw new Error('Database query failed while reading key-value store.', { cause: err });
    }
  }

  // In-Memory fallback
  const compoundKey = `${userId}:${key}`;
  return inMemoryStores.get(compoundKey) || null;
}

export async function getAllStoreValues(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.store.findMany({
        where: { userId },
      });
    } catch (err) {
      console.error('Prisma Error in getAllStoreValues:', err);
      throw new Error('Database query failed while listing key-value store.', { cause: err });
    }
  }

  // In-Memory fallback
  const list: InMemStore[] = [];
  for (const item of inMemoryStores.values()) {
    if (item.userId === userId) {
      list.push(item);
    }
  }
  return list;
}

/**
 * Saves a prediction into the database (Prisma or in-memory fallback).
 */
export async function savePrediction(userId: string, data: {
  age: number;
  bmi: number;
  sleep: number;
  exercise: number;
  smoking: boolean;
  alcohol: string;
  stress: string;
  familyHistory: string;
  existingConditions: string;
  results: string; // JSON string
}) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.prediction.create({
        data: {
          userId,
          ...data,
        },
      });
    } catch (err) {
      console.error('Prisma Error in savePrediction:', err);
      throw new Error('Database query failed while saving prediction result.', { cause: err });
    }
  }

  // In-Memory fallback
  const newPrediction: InMemPrediction = {
    id: predictionIdCounter++,
    userId,
    ...data,
    createdAt: new Date(),
  };
  inMemoryPredictions.push(newPrediction);
  return newPrediction;
}

/**
 * Retrieves the prediction history for a user (sorted by most recent first).
 */
export async function getPredictionHistory(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.prediction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('Prisma Error in getPredictionHistory:', err);
      throw new Error('Database query failed while retrieving prediction history.', { cause: err });
    }
  }

  // In-Memory fallback
  return inMemoryPredictions
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Saves a health score record into the database (Prisma or in-memory fallback).
 */
export async function saveHealthScore(userId: string, data: {
  sleep: number;
  exercise: number;
  diet: string;
  water: number;
  stress: string;
  bmi: number;
  score: number;
  breakdown: string; // JSON string representing breakdown
}) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.healthScore.create({
        data: {
          userId,
          ...data,
        },
      });
    } catch (err) {
      console.error('Prisma Error in saveHealthScore:', err);
      throw new Error('Database query failed while saving health score record.', { cause: err });
    }
  }

  // In-Memory fallback
  const newHealthScore: InMemHealthScore = {
    id: healthScoreIdCounter++,
    userId,
    ...data,
    createdAt: new Date(),
  };
  inMemoryHealthScores.push(newHealthScore);
  return newHealthScore;
}

/**
 * Retrieves the health score history for a user (sorted by most recent first).
 */
export async function getHealthScoreHistory(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.healthScore.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('Prisma Error in getHealthScoreHistory:', err);
      throw new Error('Database query failed while retrieving health score history.', { cause: err });
    }
  }

  // In-Memory fallback
  return inMemoryHealthScores
    .filter((h) => h.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Saves or upserts a lifestyle plan for a user.
 */
export async function saveLifestylePlan(userId: string, data: {
  mealPlan: string;
  workoutPlan: string;
  waterGoal: number;
  sleepSchedule: string;
  stressTips: string;
  goals?: string | null;
}) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.lifestylePlan.upsert({
        where: { userId },
        update: {
          ...data,
        },
        create: {
          userId,
          ...data,
        },
      });
    } catch (err) {
      console.error('Prisma Error in saveLifestylePlan:', err);
      throw new Error('Database query failed while saving lifestyle plan.', { cause: err });
    }
  }

  // In-Memory fallback
  const now = new Date();
  const existing = inMemoryLifestylePlans.get(userId);
  if (existing) {
    const updated: InMemLifestylePlan = {
      ...existing,
      ...data,
      updatedAt: now,
    };
    inMemoryLifestylePlans.set(userId, updated);
    return updated;
  }

  const newPlan: InMemLifestylePlan = {
    id: lifestylePlanIdCounter++,
    userId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  inMemoryLifestylePlans.set(userId, newPlan);
  return newPlan;
}

/**
 * Retrieves the current lifestyle plan for a user.
 */
export async function getLifestylePlan(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.lifestylePlan.findUnique({
        where: { userId },
      });
    } catch (err) {
      console.error('Prisma Error in getLifestylePlan:', err);
      throw new Error('Database query failed while retrieving lifestyle plan.', { cause: err });
    }
  }

  // In-Memory fallback
  return inMemoryLifestylePlans.get(userId) || null;
}

/**
 * Updates an existing lifestyle plan.
 */
export async function updateLifestylePlan(userId: string, data: Partial<{
  mealPlan: string;
  workoutPlan: string;
  waterGoal: number;
  sleepSchedule: string;
  stressTips: string;
  goals: string | null;
}>) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.lifestylePlan.update({
        where: { userId },
        data,
      });
    } catch (err) {
      console.error('Prisma Error in updateLifestylePlan:', err);
      throw new Error('Database query failed while updating lifestyle plan.', { cause: err });
    }
  }

  // In-Memory fallback
  const existing = inMemoryLifestylePlans.get(userId);
  if (!existing) {
    throw new Error('No existing lifestyle plan found to update.');
  }

  const updated: InMemLifestylePlan = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  };
  inMemoryLifestylePlans.set(userId, updated);
  return updated;
}

/**
 * Saves a new daily log into the database (Prisma or in-memory fallback).
 */
export async function saveDailyLog(userId: string, data: {
  weight: number;
  sleep: number;
  exercise: number;
}) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.dailyLog.create({
        data: {
          userId,
          ...data,
        },
      });
    } catch (err) {
      console.error('Prisma Error in saveDailyLog:', err);
      throw new Error('Database query failed while saving daily log.', { cause: err });
    }
  }

  // In-Memory fallback
  const newLog: InMemDailyLog = {
    id: dailyLogIdCounter++,
    userId,
    ...data,
    createdAt: new Date(),
  };
  inMemoryDailyLogs.push(newLog);
  return newLog;
}

/**
 * Retrieves daily log history for a specific user (most recent first).
 */
export async function getDailyLogs(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.dailyLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('Prisma Error in getDailyLogs:', err);
      throw new Error('Database query failed while retrieving daily logs.', { cause: err });
    }
  }

  // In-Memory fallback
  return inMemoryDailyLogs
    .filter((log) => log.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Saves a new daily health log (Prisma or in-memory fallback).
 */
export async function saveDailyHealthLog(userId: string, data: {
  weight: number;
  sleep: number;
  exercise: number;
  water: number;
  meals: string;
  mood: string;
}) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.dailyHealthLog.create({
        data: {
          userId,
          ...data,
        },
      });
    } catch (err) {
      console.error('Prisma Error in saveDailyHealthLog:', err);
      throw new Error('Database query failed while saving daily health log.', { cause: err });
    }
  }

  // In-Memory fallback
  const now = new Date();
  const newLog: InMemDailyHealthLog = {
    id: dailyHealthLogIdCounter++,
    userId,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  inMemoryDailyHealthLogs.push(newLog);
  return newLog;
}

/**
 * Retrieves daily health logs for a user (most recent first).
 */
export async function getDailyHealthLogs(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.dailyHealthLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('Prisma Error in getDailyHealthLogs:', err);
      throw new Error('Database query failed while retrieving daily health logs.', { cause: err });
    }
  }

  // In-Memory fallback
  return inMemoryDailyHealthLogs
    .filter((log) => log.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Updates an existing daily health log.
 */
export async function updateDailyHealthLog(userId: string, id: number, data: Partial<{
  weight: number;
  sleep: number;
  exercise: number;
  water: number;
  meals: string;
  mood: string;
}>) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      // Ensure the log belongs to this user first
      const existing = await prisma.dailyHealthLog.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new Error(`Daily health log with ID ${id} not found or unauthorized.`);
      }

      return await prisma.dailyHealthLog.update({
        where: { id },
        data,
      });
    } catch (err: any) {
      console.error('Prisma Error in updateDailyHealthLog:', err);
      throw new Error(err.message || 'Database query failed while updating daily health log.', { cause: err });
    }
  }

  // In-Memory fallback
  const logIndex = inMemoryDailyHealthLogs.findIndex((log) => log.id === id && log.userId === userId);
  if (logIndex === -1) {
    throw new Error(`Daily health log with ID ${id} not found or unauthorized.`);
  }

  const existing = inMemoryDailyHealthLogs[logIndex];
  const updated: InMemDailyHealthLog = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  };
  inMemoryDailyHealthLogs[logIndex] = updated;
  return updated;
}

/**
 * Deletes an existing daily health log.
 */
export async function deleteDailyHealthLog(userId: string, id: number) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const existing = await prisma.dailyHealthLog.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new Error(`Daily health log with ID ${id} not found or unauthorized.`);
      }

      await prisma.dailyHealthLog.delete({
        where: { id },
      });
      return { success: true, id };
    } catch (err: any) {
      console.error('Prisma Error in deleteDailyHealthLog:', err);
      throw new Error(err.message || 'Database query failed while deleting daily health log.', { cause: err });
    }
  }

  // In-Memory fallback
  const logIndex = inMemoryDailyHealthLogs.findIndex((log) => log.id === id && log.userId === userId);
  if (logIndex === -1) {
    throw new Error(`Daily health log with ID ${id} not found or unauthorized.`);
  }

  inMemoryDailyHealthLogs.splice(logIndex, 1);
  return { success: true, id };
}

/**
 * Saves a new chat message to the database (or in-memory fallback).
 */
export async function saveChatMessage(userId: string, role: 'user' | 'model', content: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.chatMessage.create({
        data: {
          userId,
          role,
          content,
        },
      });
    } catch (err) {
      console.error('Prisma Error in saveChatMessage:', err);
      throw new Error('Database query failed while saving chat message.', { cause: err });
    }
  }

  // In-Memory fallback
  const newMsg: InMemChatMessage = {
    id: chatMessageIdCounter++,
    userId,
    role,
    content,
    createdAt: new Date(),
  };
  inMemoryChatMessages.push(newMsg);
  return newMsg;
}

/**
 * Retrieves the chat message history for a user (oldest first).
 */
export async function getChatHistory(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
    } catch (err) {
      console.error('Prisma Error in getChatHistory:', err);
      throw new Error('Database query failed while retrieving chat history.', { cause: err });
    }
  }

  // In-Memory fallback
  return inMemoryChatMessages
    .filter((msg) => msg.userId === userId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/**
 * Saves a new notification for a user.
 */
export async function saveNotification(userId: string, data: { type: string, title: string, message: string }) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: false,
        },
      });
    } catch (err) {
      console.error('Prisma Error in saveNotification:', err);
      throw new Error('Database query failed while saving notification.', { cause: err });
    }
  }

  // In-Memory fallback
  const newNotif: InMemNotification = {
    id: notificationIdCounter++,
    userId,
    type: data.type,
    title: data.title,
    message: data.message,
    isRead: false,
    createdAt: new Date(),
  };
  inMemoryNotifications.push(newNotif);
  return newNotif;
}

/**
 * Retrieves notifications for a user (newest first).
 */
export async function getNotifications(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('Prisma Error in getNotifications:', err);
      throw new Error('Database query failed while retrieving notifications.', { cause: err });
    }
  }

  // In-Memory fallback
  return inMemoryNotifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Saves a new report (weekly/monthly) for a user.
 */
export async function saveReport(userId: string, data: { type: string, title: string, content: string }) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.report.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          content: data.content,
        },
      });
    } catch (err) {
      console.error('Prisma Error in saveReport:', err);
      throw new Error('Database query failed while saving report.', { cause: err });
    }
  }

  // In-Memory fallback
  const newReport: InMemReport = {
    id: reportIdCounter++,
    userId,
    type: data.type,
    title: data.title,
    content: data.content,
    createdAt: new Date(),
  };
  inMemoryReports.push(newReport);
  return newReport;
}

/**
 * Retrieves reports for a user (newest first).
 */
export async function getReports(userId: string) {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.report.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('Prisma Error in getReports:', err);
      throw new Error('Database query failed while retrieving reports.', { cause: err });
    }
  }

  // In-Memory fallback
  return inMemoryReports
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Retrieves all users for administrative purposes.
 */
export async function getAllUsersAdmin() {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.user.findMany({
        include: {
          profile: true,
          _count: {
            select: {
              predictions: true,
              healthScores: true,
              dailyHealthLogs: true,
              reports: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('Prisma Error in getAllUsersAdmin:', err);
      throw new Error('Database query failed while retrieving all users.', { cause: err });
    }
  }

  // In-Memory fallback
  const usersList = Array.from(inMemoryUsers.values());
  return usersList.map((user) => {
    const profile = inMemoryProfiles.get(user.id) || null;
    const predCount = inMemoryPredictions.filter(p => p.userId === user.id).length;
    const hsCount = inMemoryHealthScores.filter(h => h.userId === user.id).length;
    const dhlCount = inMemoryDailyHealthLogs.filter(d => d.userId === user.id).length;
    const rCount = inMemoryReports.filter(r => r.userId === user.id).length;

    return {
      ...user,
      profile,
      _count: {
        predictions: predCount,
        healthScores: hsCount,
        dailyHealthLogs: dhlCount,
        reports: rCount,
      }
    };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Retrieves all compiled health progress reports across all users.
 */
export async function getAllReportsAdmin() {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      return await prisma.report.findMany({
        include: {
          user: {
            select: {
              email: true,
              role: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('Prisma Error in getAllReportsAdmin:', err);
      throw new Error('Database query failed while retrieving all reports.', { cause: err });
    }
  }

  // In-Memory fallback
  return inMemoryReports.map((report) => {
    const user = inMemoryUsers.get(report.userId);
    return {
      ...report,
      user: user ? { email: user.email, role: user.role } : { email: 'unknown@example.com', role: 'user' }
    };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Retrieves general system metrics and advanced health analytics.
 */
export async function getSystemStatsAdmin() {
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      // 1. Core total counts
      const [totalUsers, totalPredictions, totalScores, totalLogs, totalReports] = await Promise.all([
        prisma.user.count(),
        prisma.prediction.count(),
        prisma.healthScore.count(),
        prisma.dailyHealthLog.count(),
        prisma.report.count()
      ]);

      // 2. Average metrics
      const avgProfileMetrics = await prisma.healthProfile.aggregate({
        _avg: {
          age: true,
          height: true,
          weight: true,
          bmi: true,
          sleep: true,
          exercise: true,
          waterIntake: true,
        },
        _count: true
      });

      // 3. Stress level demographics group
      const stressDemographics = await prisma.healthProfile.groupBy({
        by: ['stress'],
        _count: {
          userId: true
        }
      });

      // 4. Smoking statistics
      const smokerCount = await prisma.healthProfile.count({
        where: { smoking: true }
      });

      return {
        counts: {
          totalUsers,
          totalPredictions,
          totalScores,
          totalLogs,
          totalReports,
        },
        averages: {
          age: avgProfileMetrics._avg.age ? Math.round(avgProfileMetrics._avg.age * 10) / 10 : 0,
          height: avgProfileMetrics._avg.height ? Math.round(avgProfileMetrics._avg.height * 10) / 10 : 0,
          weight: avgProfileMetrics._avg.weight ? Math.round(avgProfileMetrics._avg.weight * 10) / 10 : 0,
          bmi: avgProfileMetrics._avg.bmi ? Math.round(avgProfileMetrics._avg.bmi * 10) / 10 : 0,
          sleep: avgProfileMetrics._avg.sleep ? Math.round(avgProfileMetrics._avg.sleep * 10) / 10 : 0,
          exercise: avgProfileMetrics._avg.exercise ? Math.round(avgProfileMetrics._avg.exercise * 10) / 10 : 0,
          waterIntake: avgProfileMetrics._avg.waterIntake ? Math.round(avgProfileMetrics._avg.waterIntake * 100) / 100 : 0,
          profilesCount: avgProfileMetrics._count
        },
        stressDistribution: stressDemographics.map(group => ({
          level: group.stress,
          count: group._count.userId
        })),
        smokers: {
          smokerCount,
          nonSmokerCount: Math.max(0, (avgProfileMetrics._count || totalUsers) - smokerCount)
        }
      };
    } catch (err) {
      console.error('Prisma Error in getSystemStatsAdmin:', err);
      throw new Error('Database query failed while retrieving system stats.', { cause: err });
    }
  }

  // In-Memory fallback calculations
  const usersList = Array.from(inMemoryUsers.values());
  const profilesList = Array.from(inMemoryProfiles.values());

  const totalUsers = usersList.length;
  const totalPredictions = inMemoryPredictions.length;
  const totalScores = inMemoryHealthScores.length;
  const totalLogs = inMemoryDailyHealthLogs.length;
  const totalReports = inMemoryReports.length;

  let sumAge = 0, sumHeight = 0, sumWeight = 0, sumBmi = 0, sumSleep = 0, sumExercise = 0, sumWater = 0;
  let smokerCount = 0;
  const stressCounts: Record<string, number> = {};

  profilesList.forEach((p) => {
    sumAge += p.age;
    sumHeight += p.height;
    sumWeight += p.weight;
    sumBmi += p.bmi;
    sumSleep += p.sleep;
    sumExercise += p.exercise;
    sumWater += p.waterIntake;
    if (p.smoking) smokerCount++;
    stressCounts[p.stress] = (stressCounts[p.stress] || 0) + 1;
  });

  const profCount = profilesList.length;

  return {
    counts: {
      totalUsers,
      totalPredictions,
      totalScores,
      totalLogs,
      totalReports,
    },
    averages: {
      age: profCount > 0 ? Math.round((sumAge / profCount) * 10) / 10 : 0,
      height: profCount > 0 ? Math.round((sumHeight / profCount) * 10) / 10 : 0,
      weight: profCount > 0 ? Math.round((sumWeight / profCount) * 10) / 10 : 0,
      bmi: profCount > 0 ? Math.round((sumBmi / profCount) * 10) / 10 : 0,
      sleep: profCount > 0 ? Math.round((sumSleep / profCount) * 10) / 10 : 0,
      exercise: profCount > 0 ? Math.round((sumExercise / profCount) * 10) / 10 : 0,
      waterIntake: profCount > 0 ? Math.round((sumWater / profCount) * 100) / 100 : 0,
      profilesCount: profCount
    },
    stressDistribution: Object.entries(stressCounts).map(([level, count]) => ({
      level,
      count
    })),
    smokers: {
      smokerCount,
      nonSmokerCount: Math.max(0, profCount - smokerCount)
    }
  };
}




