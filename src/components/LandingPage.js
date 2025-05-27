import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Grid, 
  Paper, 
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import LoginButton from './LoginButton';

const FeatureCard = ({ icon, title, description }) => {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        height: '100%', 
        borderRadius: 2, 
        border: '1px solid #e0e0e0',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ fontSize: '3rem', mb: 2, color: 'primary.main' }}>
        {icon}
      </Box>
      <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
};

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* ヒーローセクション */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                component="h1" 
                fontWeight="bold"
                sx={{ mb: 2, fontSize: { xs: '2.5rem', md: '3.5rem' } }}
              >
                SmartTodo
              </Typography>
              <Typography 
                variant="h5" 
                component="p" 
                sx={{ mb: 4, opacity: 0.9 }}
              >
                シンプルで使いやすいタスク管理アプリ
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, maxWidth: '600px' }}>
                Google Todoと連携して、あなたのタスクを効率的に管理します。
                スマートな分類、ドラッグ&ドロップ機能、直感的なUI設計で、
                毎日のタスク管理をもっと簡単に。
              </Typography>
              <Box sx={{ mt: 4 }}>
                <LoginButton />
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box 
                component="img" 
                src="/hero-image.png" 
                alt="SmartTodoのスクリーンショット"
                sx={{ 
                  width: '100%', 
                  maxWidth: '500px',
                  borderRadius: 2,
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              />
            </Grid>
          </Grid>
        </Container>
        {/* 装飾的な背景要素 */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: -100, 
            right: -100, 
            width: 300, 
            height: 300, 
            borderRadius: '50%', 
            bgcolor: 'rgba(255,255,255,0.1)',
            zIndex: 0
          }} 
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: -150, 
            left: -150, 
            width: 400, 
            height: 400, 
            borderRadius: '50%', 
            bgcolor: 'rgba(255,255,255,0.05)',
            zIndex: 0
          }} 
        />
      </Box>

      {/* 機能紹介セクション */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            component="h2" 
            fontWeight="bold"
            sx={{ mb: 2 }}
          >
            主な機能
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto' }}>
            SmartTodoは、あなたの毎日のタスク管理をサポートする多彩な機能を提供します。
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              icon="📋" 
              title="シンプルなタスク管理" 
              description="直感的なインターフェースで、タスクの作成、編集、完了が簡単にできます。複雑な設定は必要ありません。"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              icon="🔄" 
              title="Google Todoとの連携" 
              description="Google Todoと完全連携。どこからでもあなたのタスクにアクセスでき、常に最新の状態を維持します。"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              icon="📱" 
              title="どこでもアクセス" 
              description="パソコン、スマートフォン、タブレットなど、どのデバイスからでもアクセス可能。いつでもタスクを確認できます。"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              icon="🗂️" 
              title="カスタムリスト" 
              description="プロジェクトやカテゴリごとにリストを作成し、タスクを整理。ドラッグ&ドロップで簡単に並べ替えができます。"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              icon="⭐" 
              title="優先度設定" 
              description="重要なタスクにスターを付けて、優先順位を明確に。何を先に片付けるべきかが一目でわかります。"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard 
              icon="🔔" 
              title="日付フィルター" 
              description="今日、明日、今週など、日付でタスクをフィルタリング。期限切れのタスクも簡単に確認できます。"
            />
          </Grid>
        </Grid>
      </Container>

      {/* 使い方セクション */}
      <Box sx={{ bgcolor: 'background.paper', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              fontWeight="bold"
              sx={{ mb: 2 }}
            >
              簡単3ステップ
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto' }}>
              SmartTodoの使い方は簡単です。
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box 
                  sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    mb: 2,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  1
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Googleアカウントでログイン
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Googleアカウントを使って簡単にログイン。新しいアカウントを作成する必要はありません。
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box 
                  sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    mb: 2,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  2
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  タスクを追加・整理
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  新しいタスクを追加し、期限や優先度を設定。マイリストを作成してタスクを整理します。
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Box 
                  sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    mb: 2,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  3
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  タスクを管理・完了
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  タスクを完了したらチェック。編集や削除も簡単に行えます。Google Todoと自動で同期されます。
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTAセクション */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          component="h2" 
          fontWeight="bold"
          sx={{ mb: 3 }}
        >
          今すぐ始めましょう
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
          SmartTodoで、タスク管理をもっと簡単に、もっと効率的に。
          Googleアカウントがあれば、すぐに始められます。
        </Typography>
        <Box sx={{ mt: 2 }}>
          <LoginButton />
        </Box>
      </Container>

      {/* フッター */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} justifyContent="space-between" alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight="bold">
                SmartTodo
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                シンプルで使いやすいタスク管理アプリ
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' }, mt: { xs: 2, md: 0 } }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                © 2025 SmartTodo All Rights Reserved.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
