/**
 * DENCO AI Chatbot Backend
 * 
 * Dify APIと連携してチャット応答を提供するバックエンド
 * 
 * エンドポイント:
 * - POST /api/chat    : チャット応答
 * - GET  /api/health  : ヘルスチェック
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// .envファイルを読み込み
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// ========================================
// 設定
// ========================================
const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  difyApiEndpoint: process.env.DIFY_API_ENDPOINT || 'https://api.dify.ai/v1',
  difyApiKey: process.env.DIFY_API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

if (!config.difyApiKey) {
  console.warn('⚠️  警告: DIFY_API_KEY が設定されていません。.envファイルを確認してください。');
}

// ========================================
// ミドルウェア
// ========================================

// CORS設定
app.use(cors({
  origin: config.corsOrigin.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// JSONパーサー
app.use(express.json({ limit: '10mb' }));

// リクエストログ
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ========================================
// ヘルパー関数
// ========================================

/**
 * Dify APIにストリーミングリクエストを送信
 */
async function sendDifyStreamRequest(message, conversationId = '', user = 'user') {
  const url = `${config.difyApiEndpoint}/chat-messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.difyApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query: message,
      response_mode: 'streaming',
      conversation_id: conversationId || '',
      user: user,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dify API error: ${response.status} - ${errorText}`);
  }

  return response;
}

// ========================================
// APIエンドポイント
// ========================================

/**
 * ヘルスチェック
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    difyConfigured: !!config.difyApiKey,
  });
});

/**
 * チャット応答
 * Dify APIからストリーミングで取得し、結果をまとめて返す
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, user } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'メッセージが必要です',
        code: 'MISSING_MESSAGE',
      });
    }

    if (!config.difyApiKey) {
      return res.status(500).json({
        error: 'Dify APIキーが設定されていません',
        code: 'MISSING_API_KEY',
      });
    }

    // Dify APIにストリーミングリクエストを送信
    const difyResponse = await sendDifyStreamRequest(message, conversationId, user || 'user');
    
    if (!difyResponse.body) {
      throw new Error('No response body from Dify');
    }

    // ストリーミングレスポンスを読み取り
    const reader = difyResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullAnswer = '';
    let finalConversationId = conversationId || '';
    let messageId = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        
        const jsonStr = line.slice(6);
        if (jsonStr === '[DONE]') continue;

        try {
          const event = JSON.parse(jsonStr);
          
          if (event.event === 'message' || event.event === 'agent_message') {
            if (event.answer) {
              fullAnswer += event.answer;
            }
          } else if (event.event === 'message_end') {
            if (event.conversation_id) {
              finalConversationId = event.conversation_id;
            }
            if (event.message_id) {
              messageId = event.message_id;
            }
          } else if (event.event === 'error') {
            throw new Error(event.message || 'Dify error');
          }
        } catch (parseError) {
          // JSONパースエラーは無視（不完全なデータの可能性）
        }
      }
    }

    reader.releaseLock();

    res.json({
      answer: fullAnswer,
      conversationId: finalConversationId,
      messageId: messageId,
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({
      error: error.message || 'チャット処理中にエラーが発生しました',
      code: 'CHAT_ERROR',
    });
  }
});

/**
 * 会話履歴の取得
 */
app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { user } = req.query;

    if (!config.difyApiKey) {
      return res.status(500).json({
        error: 'Dify APIキーが設定されていません',
        code: 'MISSING_API_KEY',
      });
    }

    const url = `${config.difyApiEndpoint}/messages?conversation_id=${conversationId}&user=${user || 'user'}&limit=100`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.difyApiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Get messages error:', error.message);
    res.status(500).json({
      error: error.message || 'メッセージ取得中にエラーが発生しました',
      code: 'GET_MESSAGES_ERROR',
    });
  }
});

// ========================================
// エラーハンドリング
// ========================================

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({
    error: 'エンドポイントが見つかりません',
    code: 'NOT_FOUND',
  });
});

// グローバルエラーハンドラー
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: '内部サーバーエラーが発生しました',
    code: 'INTERNAL_ERROR',
  });
});

// ========================================
// サーバー起動
// ========================================

app.listen(config.port, () => {
  console.log('');
  console.log('🤖 DENCO Chatbot Backend');
  console.log('========================');
  console.log(`📡 Server: http://localhost:${config.port}`);
  console.log(`🔗 Dify API: ${config.difyApiEndpoint}`);
  console.log(`🔑 API Key: ${config.difyApiKey ? '設定済み ✓' : '未設定 ✗'}`);
  console.log(`🌐 CORS: ${config.corsOrigin}`);
  console.log('');
  console.log('エンドポイント:');
  console.log('  POST /api/chat     - チャット');
  console.log('  GET  /api/health   - ヘルスチェック');
  console.log('');
});

module.exports = app;
