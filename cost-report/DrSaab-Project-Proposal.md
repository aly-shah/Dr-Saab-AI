# DrSaab WhatsApp Coach for Diabetes
## Project Proposal, Scope of Work and Commercial Offer

**Prepared For:** DrSaab Team
**Prepared By:** Development Team
**Date:** June 2026
**Version:** 1.0
**Project Code:** DRSAAB-MVP-WA

## 1. Summary

DrSaab is a WhatsApp bot that helps people with diabetes. It talks to users in three languages: English, Urdu (in proper Urdu script), and WhatsApp Urdu (Urdu written in English letters, like Roman Urdu). The bot helps users understand their condition, build better habits, log their sugar readings, keep track of their medicines, understand their lab reports, and stay on track through reminders, coaching and friendly challenges.

Part of the work is already done. The public website **drsaabcoach.com** is live, the first version of the bot conversation flow is built, and the first version of the admin panel is ready. This proposal covers the remaining work to finish the full MVP and take it live.

| Item | Value |
|---|---|
| **Total Project Cost** | **PKR 380,000/-** |
| **Remaining Duration** | Under 5 Weeks |
| **Number of Milestones** | 5 |
| **Delivery Model** | Milestone based |
| **Yearly Support and Maintenance** | *To be discussed closer to launch* |

## 1A. Work Already Completed

The following has already been delivered. The client team can see it working today.

| Item | Status | Notes |
|---|---|---|
| **Public Website (drsaabcoach.com)** | Live | Full marketing website is up and running. The domain and the hosting belong to the client. |
| **Bot Conversation Flow (Version 1)** | Built | The first version of the WhatsApp bot's user journey is built, including the welcome flow, the profile setup chat, and the basic menu structure. |
| **Admin Panel (Version 1)** | Built | The first version of the admin panel is ready. It allows the team to view users, doctors, leaderboard data and basic content. |

The work described in the rest of this document builds on top of what has already been delivered.

## 2. Product Vision

DrSaab is a WhatsApp coach that understands diabetes, talks in the user's own language, learns about them over time, and helps them get better, one chat at a time.

**How it should feel:**

* The menus stay short. The chat itself does most of the work.
* Users find features by chatting, not by reading long menus.
* Users can type anything in plain language. The bot will figure out what they want.
* The bot respects faith, culture and the way people in Pakistan actually live.

## 3. What the Bot Will Do

### 3.1 Three Language Support

The bot detects greetings and picks the right language. The user's choice is saved and used in every future chat.

* If the user types `Hi`, `Hello` or `Hey`, the bot replies in English.
* If the user types `As Salaam Alaikum`, `Salaam`, `ASA` or `AS`, the bot offers all three languages.
* If the user types `السلام علیکم`, the bot replies in Urdu.

Common commands like `Menu`, `Home`, `Back`, `Cancel`, `Help` and `Upgrade` work in all three languages.

### 3.2 Profile Setup Chat (16 Steps)

When a new user joins, the bot walks them through a short chat to learn the basics about them and their diabetes.

| Step | What the Bot Asks | What It Saves |
|---|---|---|
| 1 | Name | Full name and first name |
| 2 | Who they are | Has diabetes, has prediabetes, not sure, family member, or just exploring |
| 3 | Age or date of birth | Age and date of birth |
| 4 | Gender | Male, female, or prefer not to say |
| 5 | City | City |
| 6 | Diabetes type | Type 1, Type 2, Prediabetes, Gestational, or not sure |
| 7 | How long since diagnosis | Time since the user was first told |
| 8 | Latest HbA1c | The value and roughly when the test was done |
| 9 | Recent sugar readings | Fasting and random readings with dates |
| 10 | Diabetes medicines | Name, dose and how often, for each medicine |
| 11 | Other health problems and medicines | Other conditions and the medicines for them |
| 12 | Sugar checking at home | How often, and what device (glucometer, CGM, or both) |
| 13 | Main goal | Lower HbA1c, lose weight, eat better, exercise, stay consistent, or learn more |
| 14 | Biggest hurdle | Diet, exercise, motivation, medicines, stress, time, or knowledge |
| 15 | What pushes them | Family, health, longer life, avoiding complications, looks, or faith |
| 16 | Profile done and disclaimer | User taps "I Understand" to confirm |

### 3.3 Information the System Saves on Its Own

The user does not have to type these. The system records them in the background.

* User ID, WhatsApp number, signup date and time, last active date
* Referral code and who referred them
* Current plan, language choice, whether profile setup is finished
* Four scores that all start at 50: Consistency, Motivation, Risk and Engagement
* Total check ins and current streak

### 3.4 Main Menu (Changes Based on the User's Plan)

| Feature | Starter (Free) | Consistency Coach | Executive Coach |
|---|---|---|---|
| Check In | Yes | Yes | Yes |
| Log Sugar | Yes | Yes | Yes |
| Food and Meals | Yes | Yes | Yes |
| Medicines | Yes | Yes | Yes |
| Ask DrSaab | Basic | Full | Full |
| Explain My Lab Test | Limited use | More use | More use |
| Goals | Yes | Yes | Yes |
| Challenges | Yes | Yes | Yes |
| Learn | Yes | Yes | Yes |
| My Progress | No | Yes | Yes |
| Reports | No | Yes | Yes |
| Executive Services | No | No | Yes |

### 3.5 Main Features

| Feature | What It Does |
|---|---|
| **Check In** | A short daily chat about how the user feels, their mood, sleep and any symptoms. |
| **Log Sugar** | Save fasting, random or after-meal readings with the time. |
| **Food and Meals** | Log meals and get feedback. The advice fits Pakistani eating habits. |
| **Medicines** | Track diabetes and other medicines, set reminders and check if doses are missed. |
| **Ask DrSaab** | Users can ask any diabetes question in plain words. The bot answers using AI. |
| **Explain My Lab Test** | Users send or type their lab report. The bot explains it in simple words. |
| **My Goals** | Set goals, track them, and review how they are going. |
| **Challenges** | Join group challenges like 90 day HbA1c, weight loss, walking, Ramadan, doctor or company challenges. |
| **Learn** | Short videos, articles and voice notes about diabetes. |
| **My Progress** | Trends, streaks and scores. Only for paid plans. |
| **Reports** | Simple summary reports the user can share with their doctor. Only for paid plans. |
| **Executive Services** | Doctor reviews, live coach sessions and priority help. Only for the top plan. |
| **Settings** | Change language, plan, profile details or turn off reminders. |

### 3.6 Background Profile Building (12 Areas, About 60 Questions)

The bot does not ask everything at signup. Instead it asks a question here and there during normal chats, over time. This keeps the signup short and still builds a full picture of the user.

The 12 areas:

1. Body and health (weight, height, waist, BP, weight goal)
2. Daily life (job, work type, activity, sleep)
3. Family (marital status, children, who they care for)
4. What motivates them and how they like to be coached
5. Faith and personal values
6. Diabetes habits and weak spots
7. Food and eating habits
8. Comfort with phones and apps
9. Their doctor and clinic
10. Where they buy medicines
11. Where they get health info and how they like to learn
12. Willingness to pay, employer, and referrals

This data helps with better coaching, better content, doctor reports, and offering the right plan to the right user.

### 3.7 Challenges

Users can join the following challenges. Each one tracks the type, code, team, doctor or company link, start date, end date and current status.

* 90 Day HbA1c Challenge
* Weight Loss Challenge
* Walking Challenge
* Consistency Challenge
* Ramadan Health Challenge
* Doctor Challenge (linked to a doctor code)
* Corporate Challenge (linked to a company code)

### 3.8 Executive Services (Top Plan Only)

* Request a doctor to review their case
* Book a live coach session
* Get an executive progress review
* Priority help when they have an issue
* Access to premium learning content

### 3.9 Plans, Upgrades and Safety

* Three plans: Starter (free), Consistency Coach and Executive Coach. The menu always shows what is allowed on the user's plan.
* When a free user tries to open a paid feature, the bot gently shows what they get on a paid plan, with "View Plans" or "Maybe Later" buttons.
* A clear medical disclaimer is shown, and the user has to tap "I Understand" before continuing.
* If a user mentions a serious symptom (chest pain, fainting, very high or very low sugar), the bot tells them to seek a doctor or emergency help right away.

## 4. Subscription Plans (Packages)

Users can pick between three plans. The plans are shown right inside WhatsApp. Anyone can start on the free plan and upgrade later whenever they want.

### 4.1 Starter Plan (Free)

For users who want to try DrSaab without paying. It gives real value while keeping the deeper features for paid users.

**What is included:**

* Daily check ins
* Sugar logging (fasting, random, after meal)
* Basic medicine tracking and reminders
* Food and meal logging with simple feedback
* Basic Ask DrSaab AI chat with short answers
* A few Lab Test explanations per month
* Setting personal goals
* Joining free challenges
* Learn section (articles, videos, voice notes)
* All chat in English, Urdu and WhatsApp Urdu

### 4.2 Consistency Coach (Paid)

For users who are serious about managing their diabetes. Adds proper progress tracking, deeper AI chat and reports they can share with their doctor.

**What is included:**

* Everything in the Starter plan
* Full Ask DrSaab AI chat with longer and more detailed answers
* More uses of the Lab Test explanation feature
* My Progress section with charts, trends and the four user scores
* Weekly and monthly summary reports for the user
* Doctor friendly report the user can save and share with their doctor
* Smart medicine and sugar reading reminders
* Access to all challenges, including doctor and corporate challenges

### 4.3 Executive Coach (Premium)

For users who want a high touch service with direct human support. Adds premium content and human help on top of everything else.

**What is included:**

* Everything in the Consistency Coach plan
* Request a doctor to review the user's case and notes
* Book a live coach session
* Executive progress review every three months
* Priority help when the user has a question or issue
* Access to premium learning content and resources

## 5. What Will Be Delivered

### Software

1. WhatsApp Business API connection
2. The chat engine that handles every conversation
3. All chat text in English, Urdu and WhatsApp Urdu
4. AI for Ask DrSaab and Explain My Lab Test
5. User database with about 60 fields per user
6. Scoring system for the four user scores
7. Plan and subscription handling
8. Referral and invite code system
9. Challenges system
10. Reminder and notification sending
11. Admin panel
12. Reports for users and doctors

### Documents and Setup

* System diagram
* Chat flow diagrams
* Database structure
* API notes
* Admin panel guide
* Operations notes
* Live hosting, domain and SSL
* Help with Meta Business verification
* Help getting the WhatsApp number ready
* Backups and basic monitoring

## 6. Milestones and Payments

The total project cost is PKR 380,000. The remaining work is split across 5 milestones and will be completed in under 5 weeks. Each milestone is billed when it is delivered and accepted.

| No. | Milestone | What Gets Done | Time | % | Amount (PKR) |
|---|---|---|---|---|---|
| **M1** | Chat scripts in all three languages and welcome flow polish | Final chat scripts in English, Urdu and WhatsApp Urdu added on top of the version 1 flow. Greeting detection, language switching, profile setup and the disclaimer step finalised across all three languages. | 1 week | 15% | **57,000** |
| **M2** | Main menu and core features | Plan based main menu, Check In, Log Sugar, Food and Meals, Medicines, Goals, Settings, common commands and reminders. | 1 week | 20% | **76,000** |
| **M3** | AI features and background profile building | Ask DrSaab AI chat, Explain My Lab Test AI feature, the 12 area background profile builder, and the user scoring system. | 1 week | 25% | **95,000** |
| **M4** | Plans, challenges, executive services and reports | Three plan system, upgrade prompts, all challenges, executive services menu, My Progress, Reports, the referral system, and matching admin panel updates. | 1 week | 25% | **95,000** |
| **M5** | Testing, pilot, launch and handover | Full testing on real WhatsApp numbers, pilot run with a few users, going live on the client's number, admin panel training, and 2 weeks of support after launch. | 0.5 week | 15% | **57,000** |
| | | | **Under 5 weeks** | **100%** | **380,000** |

### Payment Terms

* The first milestone (PKR 57,000) is paid at the start to begin the work.
* The next milestones are billed when each one is delivered and accepted.
* The price does not include outside costs like Meta's WhatsApp message charges, AI service fees from providers like OpenAI or Anthropic, and hosting renewals. These are billed at actual cost.

## 7. Recommended Payment Gateways

Pakistani users and international users pay in different ways. The right setup is to use one gateway for users in Pakistan and one for users outside Pakistan. The bot can check the user's country and show the correct option at upgrade time.

### 7.1 For Users in Pakistan

We recommend the two biggest mobile wallets in Pakistan. Together they cover almost every smartphone user, and paying is fast since most users already have these apps on their phone.

| Gateway | What It Handles | Why It Is Recommended |
|---|---|---|
| **JazzCash** | Mobile wallet payments | Pakistan's biggest mobile wallet. Most users already have it on their phone, so paying takes one tap. |
| **EasyPaisa** | Mobile wallet payments | The second biggest mobile wallet. Covers most users who do not use JazzCash. |

### 7.2 For International Users

For users paying from outside Pakistan, the standard global gateways are the best choice. They support recurring subscriptions, multiple currencies, and digital wallets like Apple Pay and Google Pay.

| Gateway | What It Handles | Why It Is Recommended |
|---|---|---|
| **Stripe** | Cards, Apple Pay, Google Pay, subscriptions, in 135+ currencies | The most trusted international payment gateway. Best for recurring subscriptions and clean integration. |
| **PayPal** | PayPal balance and cards | Very widely used and trusted. A good backup for users who prefer PayPal over giving their card details. |

*Note: Stripe does not directly support businesses based in Pakistan. To use Stripe, the client would normally register a company outside Pakistan (for example through Stripe Atlas in the United States). We can guide the client through this if needed.*

## 8. What Is Not Included in the MVP

These can be quoted separately if needed later.

* Separate iPhone or Android apps
* Live video calls with doctors
* Medicine delivery from pharmacies
* Insurance claims
* Linking with hospital record systems
* A dashboard for many clinics at once
* Online payment gateway (can be added in the next phase)

## 9. Things We Need From the Client

1. Access to your Meta Business Manager account and the WhatsApp number you want to use.
2. Continued access to the existing hosting and domain (drsaabcoach.com), which the client owns.
3. Final approved chat content in all three languages. We will polish and format it.
4. AI usage charges are billed as they are used.
5. Any learning content you want inside the Learn section.
6. Feedback on each milestone within 3 working days.

## 10. Support After Launch and Yearly Maintenance

Two weeks of free support are included after launch, as part of M5.

After that, a yearly support and maintenance package can be added. It would cover:

* Fixing bugs and keeping things stable
* Keeping the bot working when WhatsApp or Meta change their rules
* Updating chat content in all three languages
* Watching the server and keeping uptime healthy
* A short performance report every three months
* Small feature changes or improvements

**Yearly Maintenance Fee:** *To be discussed.* It will be agreed closer to launch, once we know how many users, how much chat traffic and how much AI use to plan for.

## 11. Why This Approach Works

* Users prefer chatting over picking from long menus. The bot is built around chat first.
* It works in English, Urdu and Roman Urdu from day one. This fits how people in Pakistan really write on WhatsApp.
* The bot learns about the user slowly during normal chats. Users do not have to fill long forms.
* The free plan and two paid plans are built in, so the product can earn from day one.
* The two AI features (Ask DrSaab and Explain My Lab Test) give users something they can clearly feel and use.
* Faith and culture are respected. Ramadan support and faith based motivation are included as options.

## 12. Acceptance

| Party | Name | Signature | Date |
|---|---|---|---|
| **Client** | | | |
| **Vendor** | | | |

*This proposal is valid for 30 days from the date above.*
