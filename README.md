# 🤖 Discord Logger Bot

Bot Discord ultra-complet qui log **absolument tout** ce qui se passe sur ton serveur.

## 📋 Ce qui est loggé

| Catégorie | Événements |
|-----------|-----------|
| 💬 Messages | Suppression, suppression en masse, modification |
| 😀 Réactions | Ajout, retrait, retrait total |
| 👥 Membres | Arrivée, départ, pseudo, avatar serveur |
| 🛡️ Modération | Ban, unban, timeout, retrait timeout |
| 🎖️ Rôles | Création, suppression, modification, ajout/retrait sur membre |
| 📢 Salons | Création, suppression, modification, messages épinglés |
| 🧵 Threads | Création, suppression, modification, membres |
| 🔊 Vocal | Rejoindre, quitter, changer, mute/sourd/caméra/stream |
| 🎭 Stage | Création, suppression, modification |
| ⚙️ Serveur | Modification des paramètres, intégrations |
| 😀 Emojis | Création, suppression, modification des emojis & stickers |
| 📨 Invitations | Création, suppression |
| 🪝 Webhooks | Mise à jour |
| 🛡️ AutoMod | Déclenchement, règles créées/supprimées/modifiées |
| 📅 Événements | Création, suppression, modification, intérêts |
| 👤 Profil | Changement pseudo/avatar global |

## 🚀 Installation

### 1. Installer Node.js
Télécharge Node.js (v18+) sur https://nodejs.org

### 2. Créer le bot Discord
1. Va sur https://discord.com/developers/applications
2. Clique **"New Application"** → donne un nom → **"Bot"** → **"Add Bot"**
3. Active ces **Privileged Gateway Intents** :
   - ✅ **PRESENCE INTENT**
   - ✅ **SERVER MEMBERS INTENT**
   - ✅ **MESSAGE CONTENT INTENT**
4. Copie le **Token**

### 3. Inviter le bot
Génère un lien d'invitation avec ces permissions :
- `bot` scope
- Permissions : `View Channels`, `Read Message History`, `Send Messages`, `Embed Links`, `View Audit Log`

### 4. Configurer
```bash
cp .env.example .env
# Édite .env avec ton token et l'ID du salon de logs
```

### 5. Lancer
```bash
npm install
npm start
```

## ⚙️ Configuration avancée

Tu peux séparer les logs par catégorie dans des salons différents en renseignant les variables `LOG_*_CHANNEL` dans le fichier `.env`.

## 📝 Notes
- Le bot ignore ses propres messages et ceux des autres bots
- Les données sensibles (contenu des messages) sont tronquées à 1024 caractères
- Les IDs sont toujours affichés pour faciliter la modération
