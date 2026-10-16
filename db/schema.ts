import {sqliteTable,text,integer,uniqueIndex,index} from 'drizzle-orm/sqlite-core';
export const launchSubscribers=sqliteTable('launch_subscribers',{
  id:text('id').primaryKey(),email:text('email').notNull().unique(),interest:text('interest').notNull(),
  consentText:text('consent_text').notNull(),consentVersion:text('consent_version').notNull(),
  createdAt:text('created_at').notNull(),removalHash:text('removal_hash').notNull()
},table=>[uniqueIndex('subscriber_removal_hash').on(table.removalHash)]);
export const signupLimits=sqliteTable('signup_limits',{
  bucket:text('bucket').primaryKey(),attempts:integer('attempts').notNull(),expiresAt:integer('expires_at').notNull()
},table=>[index('limits_expiration').on(table.expiresAt)]);
