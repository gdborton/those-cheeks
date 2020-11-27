#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './ui';

const cli = meow(`
	Usage
	  $ those-cheeks

	Options
		--name  Your name

	Examples
	  $ those-cheeks --name=Jane
	  Hello, Jane
`, {
	flags: {
		name: {
			type: 'string'
		}
	}
});

render(<App />);
