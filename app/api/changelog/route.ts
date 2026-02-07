import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
    try {
        const changelogPath = join(process.cwd(), 'PUBLIC_CHANGELOG.md');
        const content = readFileSync(changelogPath, 'utf-8');
        return NextResponse.json({ content });
    } catch (error) {
        return NextResponse.json({ content: 'Changelog не найден' }, { status: 404 });
    }
}
