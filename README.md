# 🎬 Virtual Vision Bot — Guide d'installation

## Prérequis

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- Un **bot Discord** créé sur [discord.com/developers](https://discord.com/developers/applications)
- Activer les **Privileged Gateway Intents** (Presence, Server Members, Message Content) dans le portail développeur

---

## Installation rapide

```bash
cd "bot discord"
cp .env.example .env
# Éditer .env avec vos valeurs (voir ci-dessous)
npm install
npm start
```

## Configuration du `.env`

```env
BOT_TOKEN=votre_token_de_bot
CLIENT_ID=id_de_votre_application
GUILD_ID=id_de_votre_serveur
DASHBOARD_PORT=3000
DASHBOARD_SECRET=un_mot_de_passe_secret_pour_le_dashboard
OWNER_ID=votre_id_discord
```

---

## Commandes slash disponibles

### Configuration (Admin)
| Commande | Description |
|----------|-------------|
| `/setup tickets <catégorie> <salon_logs> <rôle_staff>` | Configure les tickets |
| `/setup moderation <salon_logs> [rôle_mute]` | Configure la modération |
| `/setup reviews <salon>` | Configure le salon des avis |
| `/setup panel` | Envoie le panel de tickets dans le salon |

### Modération (Staff)
| Commande | Description |
|----------|-------------|
| `/ban <user> [raison]` | Bannir |
| `/kick <user> [raison]` | Expulser |
| `/mute <user> <durée> [raison]` | Timeout (5m, 1h, 1d...) |
| `/unmute <user>` | Retirer le timeout |
| `/warn <user> <raison>` | Avertissement |
| `/warnings <user>` | Voir les avertissements |
| `/clear <nombre> [user]` | Supprimer des messages |
| `/slowmode <secondes>` | Mode lent |
| `/userinfo [user]` | Info utilisateur |
| `/serverinfo` | Info serveur |

---

## Dashboard Web

Accessible sur `http://localhost:3000` (ou le port configuré).

**Connexion :** Entrer la clé secrète définie dans `DASHBOARD_SECRET`.

**Sections :**
- 🏠 **Accueil** — Stats globales (tickets, avis, revenus)
- 🎫 **Tickets** — Liste, filtres, transcripts
- ⭐ **Avis** — Modifier, supprimer, masquer les avis clients
- 🛡️ **Modération** — Avertissements et logs anti-raid
- ⚙️ **Configuration** — Paramètres serveur et gestion des services/tarifs
- 📊 **Statistiques** — Vue d'ensemble chiffrée

---

## Système de Tickets

1. L'admin lance `/setup panel` → un embed avec menu déroulant apparaît
2. Le client sélectionne un service → un salon privé est créé
3. Un staff clique **📌 Claim** → bannière générée avec prix + note du staff
4. À la fin, staff clique **🔒 Fermer** → transcript HTML sauvegardé, avis demandé en MP
5. Le client note de 1 à 5 étoiles + commentaire optionnel

### Services par défaut
| Service | Prix |
|---------|------|
| 🎬 Montage Basique | 15€ |
| 🎥 Montage Avancé | 30€ |
| ✨ Motion Design | 45€ |
| 🖼️ Miniature/Thumbnail | 10€ |
| 🎵 Intro/Outro | 20€ |
| 📦 Pack Complet | 75€ |

> Modifiables via le dashboard ou directement en base de données.

---

## Anti-Raid (Auto-configuré)

**Zéro configuration requise.** Fonctionne dès l'ajout du bot.

| Protection | Détail |
|------------|--------|
| 🔗 Anti-link | Tous les liens (Discord, URLs, shorteners, obfusqués) |
| 💬 Anti-spam | Messages répétés, flood, mass mentions, emoji spam, CAPS |
| 🖼️ Anti-media | 3+ images/GIFs/stickers en 10s |
| 🚪 Anti-raid join | 5+ joins en 10s → lockdown, kick comptes < 7 jours |

**Punitions progressives :**
1. Suppression silencieuse
2. Timeout 5 min
3. Timeout 1h
4. Ban

Staff (permission Gérer les Messages) = exempt automatiquement.

---

## Personnalisation

- **Logo** : Placez votre logo dans `assets/logo.png` pour les bannières de tickets
- **Thème** : Couleurs modifiables dans `dashboard/css/style.css` (variables CSS)
- **Services** : Modifiables via le dashboard section Configuration

---

## Structure du projet

```
bot discord/
├── index.js              # Point d'entrée
├── package.json
├── .env.example
├── deploy-commands.js
├── database/
│   └── db.js             # SQLite (better-sqlite3)
├── commands/
│   ├── setup.js           # /setup
│   └── mod/               # /ban, /kick, /mute, etc.
├── events/
│   ├── interactionCreate.js
│   ├── messageCreate.js
│   └── guildMemberAdd.js
├── systems/
│   ├── antiraid.js        # Anti-raid auto-configuré
│   ├── tickets.js         # Système de tickets complet
│   ├── reviews.js         # Gestion des avis
│   └── moderation.js      # Logger de modération
├── templates/
│   ├── banner.js          # Génération de bannières (canvas)
│   └── transcript.js      # Transcripts HTML
├── api/
│   ├── server.js          # Express API
│   └── routes/
│       ├── config.js
│       ├── tickets.js
│       ├── reviews.js
│       ├── moderation.js
│       └── bot.js
├── dashboard/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
└── assets/
    └── logo.png           # (à ajouter)
```
