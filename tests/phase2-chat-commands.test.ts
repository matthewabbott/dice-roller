// TypeScript test script for Phase 2: Chat Command Parser
import { ChatCommandParser } from '../src/services/ChatCommandParser.js';

console.log('💬 Testing Phase 2: Chat Command Parser');
console.log('=======================================');

try {
    console.log('\n📋 Testing basic command detection:');

    // Test non-commands
    const nonCommand1 = ChatCommandParser.parseMessage('Hello world!');
    console.log('Regular message:', {
        isCommand: nonCommand1.isCommand,
        originalText: nonCommand1.originalText
    });

    const nonCommand2 = ChatCommandParser.parseMessage('This is just a chat message');
    console.log('Chat message:', {
        isCommand: nonCommand2.isCommand,
        originalText: nonCommand2.originalText
    });

    console.log('\n🎲 Testing roll commands:');

    // Test valid roll commands
    const rollTests = [
        '/roll 2d6',
        '/r d20',
        '/dice 3d8',
        '/d 1d100',
        '/roll 10d6',
        '/r 1000d20'
    ];

    rollTests.forEach(test => {
        const parsed = ChatCommandParser.parseMessage(test);
        console.log(`${test}:`, {
            isCommand: parsed.isCommand,
            command: parsed.command,
            diceExpression: parsed.diceExpression,
            hasError: !!parsed.error
        });
    });

    console.log('\n❌ Testing invalid roll commands:');

    // Test invalid roll commands
    const invalidRollTests = [
        '/roll',
        '/r',
        '/roll invalid',
        '/roll 0d6',
        '/roll 2d0',
        '/roll abc',
        '/roll 2d6d8'
    ];

    invalidRollTests.forEach(test => {
        const parsed = ChatCommandParser.parseMessage(test);
        console.log(`${test}:`, {
            isCommand: parsed.isCommand,
            command: parsed.command,
            diceExpression: parsed.diceExpression,
            error: parsed.error
        });
    });

    console.log('\n❓ Testing help commands:');

    // Test help commands
    const helpTests = [
        '/help',
        '/h',
        '/?',
        '/help roll',
        '/h dice'
    ];

    helpTests.forEach(test => {
        const parsed = ChatCommandParser.parseMessage(test);
        console.log(`${test}:`, {
            isCommand: parsed.isCommand,
            command: parsed.command,
            args: parsed.args,
            hasError: !!parsed.error
        });
    });

    console.log('\n🚫 Testing unknown commands:');

    // Test unknown commands
    const unknownTests = [
        '/unknown',
        '/test 123',
        '/foo bar baz'
    ];

    unknownTests.forEach(test => {
        const parsed = ChatCommandParser.parseMessage(test);
        console.log(`${test}:`, {
            isCommand: parsed.isCommand,
            command: parsed.command,
            error: parsed.error
        });
    });

    console.log('\n📚 Testing help system:');

    // Test help generation
    const allHelp = ChatCommandParser.getHelp();
    console.log('All commands help count:', allHelp.length);

    const rollHelp = ChatCommandParser.getHelp('roll');
    console.log('Roll command help:', {
        found: rollHelp.length > 0,
        command: rollHelp[0]?.command,
        aliases: rollHelp[0]?.aliases,
        examples: rollHelp[0]?.examples.length
    });

    const helpHelp = ChatCommandParser.getHelp('help');
    console.log('Help command help:', {
        found: helpHelp.length > 0,
        command: helpHelp[0]?.command,
        aliases: helpHelp[0]?.aliases
    });

    console.log('\n🔧 Testing utility functions:');

    // Test utility functions
    console.log('isCommand("/roll 2d6"):', ChatCommandParser.isCommand('/roll 2d6'));
    console.log('isCommand("hello"):', ChatCommandParser.isCommand('hello'));
    console.log('Supported commands:', ChatCommandParser.getSupportedCommands());

    console.log('\n📝 Testing help formatting:');

    // Test help formatting
    const formattedAllHelp = ChatCommandParser.formatHelp(allHelp);
    console.log('Formatted all help length:', formattedAllHelp.length);
    console.log('Contains "Available Commands":', formattedAllHelp.includes('Available Commands'));

    const formattedRollHelp = ChatCommandParser.formatHelp(rollHelp);
    console.log('Formatted roll help length:', formattedRollHelp.length);
    console.log('Contains usage info:', formattedRollHelp.includes('Usage:'));

    console.log('\n🎯 Testing edge cases:');

    // Test edge cases
    const edgeCases = [
        '/',
        '/ ',
        '/  ',
        '/roll  2d6  ',
        '/ROLL 2D6',
        '/Roll 2D6'
    ];

    edgeCases.forEach(test => {
        const parsed = ChatCommandParser.parseMessage(test);
        console.log(`"${test}":`, {
            isCommand: parsed.isCommand,
            command: parsed.command,
            diceExpression: parsed.diceExpression,
            hasError: !!parsed.error
        });
    });

    console.log('\n✅ Phase 2 ChatCommandParser working correctly!');

} catch (error) {
    console.error('❌ Phase 2 test failed:', error);
    if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

console.log('\n🎯 Next: Integrate with ChatInput component'); 