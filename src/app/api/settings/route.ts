import { NextRequest, NextResponse } from 'next/server';
import { getSettings, resetToDefaultDataset, saveSettings } from '@/lib/storage';

export async function GET() {
  try {
    const settings = await getSettings();
    // Mask sensitive keys for client-side display
    const masked = {
      ...settings,
      openaiApiKey: settings.openaiApiKey ? 'sk-••••••••' : '',
      anthropicApiKey: settings.anthropicApiKey ? 'sk-ant-••••••••' : '',
      geminiApiKey: settings.geminiApiKey ? 'AIza••••••••' : '',
      hasEnvKeys: Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY),
    };
    return NextResponse.json({ settings: masked });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'reset_seed') {
      const events = await resetToDefaultDataset();
      return NextResponse.json({ success: true, message: 'Reset to seed benchmark dataset', count: events.length });
    }

    const updated = await saveSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
