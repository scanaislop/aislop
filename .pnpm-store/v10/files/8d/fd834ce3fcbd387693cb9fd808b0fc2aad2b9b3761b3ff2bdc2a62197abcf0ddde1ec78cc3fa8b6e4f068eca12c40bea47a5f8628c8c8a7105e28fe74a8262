import tokenizeAnsi from './tokenize-ansi.js';

function applySgrFragments(activeStyles, fragments) {
	for (const fragment of fragments) {
		switch (fragment.type) {
			case 'reset': {
				activeStyles.clear();
				break;
			}

			case 'end': {
				activeStyles.delete(fragment.endCode);
				break;
			}

			case 'start': {
				activeStyles.delete(fragment.endCode);
				activeStyles.set(fragment.endCode, fragment.code);
				break;
			}

			default: {
				break;
			}
		}
	}

	return activeStyles;
}

function undoAnsiCodes(activeStyles) {
	return [...activeStyles.keys()].toReversed().join('');
}

function closeHyperlink(hyperlinkToken) {
	return `${hyperlinkToken.closePrefix}${hyperlinkToken.terminator}`;
}

function shouldIncludeSgrAfterEnd(token, activeStyles) {
	let hasStartFragment = false;
	let hasClosingEffect = false;

	for (const fragment of token.fragments) {
		if (fragment.type === 'start') {
			hasStartFragment = true;
			continue;
		}

		if (fragment.type === 'reset' && activeStyles.size > 0) {
			hasClosingEffect = true;
			continue;
		}

		if (fragment.type === 'end' && activeStyles.has(fragment.endCode)) {
			hasClosingEffect = true;
		}
	}

	return hasClosingEffect && !hasStartFragment;
}

function hasSgrStartFragment(token) {
	return token.fragments.some(fragment => fragment.type === 'start');
}

function discardPendingHyperlink(parameters) {
	if (
		parameters.activeHyperlink
		&& !parameters.activeHyperlinkHasVisibleText
		&& parameters.activeHyperlinkOutputIndex !== undefined
	) {
		const openCodeLength = parameters.activeHyperlink.code.length;
		parameters.returnValue = parameters.returnValue.slice(0, parameters.activeHyperlinkOutputIndex) + parameters.returnValue.slice(parameters.activeHyperlinkOutputIndex + openCodeLength);

		if (
			parameters.pendingSgrOutputIndex !== undefined
			&& parameters.pendingSgrOutputIndex > parameters.activeHyperlinkOutputIndex
		) {
			parameters.pendingSgrOutputIndex -= openCodeLength;
		}
	}

	parameters.activeHyperlink = undefined;
	parameters.activeHyperlinkHasVisibleText = false;
	parameters.activeHyperlinkOutputIndex = undefined;
}

function applySgrToken(parameters) {
	if (
		parameters.isPastEnd
		&& !shouldIncludeSgrAfterEnd(parameters.token, parameters.activeStyles)
	) {
		return parameters;
	}

	if (
		parameters.include
		&& hasSgrStartFragment(parameters.token)
		&& parameters.pendingSgrOutputIndex === undefined
	) {
		parameters.pendingSgrOutputIndex = parameters.returnValue.length;
		parameters.pendingSgrActiveStyles = new Map(parameters.activeStyles);
	}

	parameters.activeStyles = applySgrFragments(parameters.activeStyles, parameters.token.fragments);
	if (parameters.include) {
		parameters.returnValue += parameters.token.code;
	}

	return parameters;
}

function applyHyperlinkToken(parameters) {
	if (
		parameters.isPastEnd
		&& (
			parameters.token.action !== 'close'
			|| !parameters.activeHyperlink
		)
	) {
		return parameters;
	}

	if (parameters.token.action === 'open') {
		parameters.activeHyperlink = parameters.token;
		parameters.activeHyperlinkHasVisibleText = false;
		parameters.activeHyperlinkOutputIndex = undefined;
		if (parameters.include) {
			parameters.activeHyperlinkOutputIndex = parameters.returnValue.length;
		}
	} else if (parameters.token.action === 'close') {
		if (
			parameters.include
			&& parameters.activeHyperlink
			&& !parameters.activeHyperlinkHasVisibleText
		) {
			discardPendingHyperlink(parameters);
			return parameters;
		}

		parameters.activeHyperlink = undefined;
		parameters.activeHyperlinkHasVisibleText = false;
		parameters.activeHyperlinkOutputIndex = undefined;
	}

	if (parameters.include) {
		parameters.returnValue += parameters.token.code;
	}

	return parameters;
}

function applyControlToken(parameters) {
	if (!parameters.isPastEnd && parameters.include) {
		parameters.returnValue += parameters.token.code;
	}

	return parameters;
}

function applyCharacterToken(parameters) {
	if (
		!parameters.include
		&& parameters.position >= parameters.start
		&& !parameters.token.isGraphemeContinuation
	) {
		parameters.include = true;
		parameters.returnValue = [...parameters.activeStyles.values()].join('');
		if (parameters.activeHyperlink) {
			parameters.activeHyperlinkOutputIndex = parameters.returnValue.length;
			parameters.returnValue += parameters.activeHyperlink.code;
		}
	}

	if (parameters.include) {
		parameters.returnValue += parameters.token.value;
		parameters.pendingSgrOutputIndex = undefined;
		parameters.pendingSgrActiveStyles = undefined;
		if (parameters.activeHyperlink) {
			parameters.activeHyperlinkHasVisibleText = true;
		}
	}

	parameters.position += parameters.token.visibleWidth;
	return parameters;
}

const tokenHandlers = {
	sgr: applySgrToken,
	hyperlink: applyHyperlinkToken,
	control: applyControlToken,
	character: applyCharacterToken,
};

function applyToken(parameters) {
	const tokenHandler = tokenHandlers[parameters.token.type];
	if (!tokenHandler) {
		return parameters;
	}

	return tokenHandler(parameters);
}

function createHasContinuationAheadMap(tokens) {
	const hasContinuationAhead = Array.from({length: tokens.length}, () => false);
	let nextCharacterIsContinuation = false;

	for (let tokenIndex = tokens.length - 1; tokenIndex >= 0; tokenIndex--) {
		const token = tokens[tokenIndex];
		hasContinuationAhead[tokenIndex] = nextCharacterIsContinuation;
		if (token.type === 'character') {
			nextCharacterIsContinuation = Boolean(token.isGraphemeContinuation);
		}
	}

	return hasContinuationAhead;
}

function isPastEndBoundary(token, position, end) {
	if (end === undefined) {
		return false;
	}

	if (position >= end) {
		return true;
	}

	return token.type === 'character'
		&& !token.isGraphemeContinuation
		&& position + token.visibleWidth > end;
}

export default function sliceAnsi(string, start, end) {
	const tokens = tokenizeAnsi(string, {endCharacter: end});
	const hasContinuationAhead = createHasContinuationAheadMap(tokens);
	let activeStyles = new Map();
	let activeHyperlink;
	let activeHyperlinkHasVisibleText = false;
	let activeHyperlinkOutputIndex;
	let pendingSgrOutputIndex;
	let pendingSgrActiveStyles;
	let position = 0;
	let returnValue = '';
	let include = false;

	for (const [tokenIndex, token] of tokens.entries()) {
		let isPastEnd = isPastEndBoundary(token, position, end);
		if (
			isPastEnd
			&& token.type !== 'character'
			&& hasContinuationAhead[tokenIndex]
		) {
			isPastEnd = false;
		}

		if (
			isPastEnd
			&& token.type === 'character'
			&& !token.isGraphemeContinuation
		) {
			if (activeHyperlink && !activeHyperlinkHasVisibleText) {
				const hyperlinkState = {
					activeHyperlink,
					activeHyperlinkHasVisibleText,
					activeHyperlinkOutputIndex,
					pendingSgrOutputIndex,
					returnValue,
				};
				discardPendingHyperlink(hyperlinkState);
				({
					activeHyperlink,
					activeHyperlinkHasVisibleText,
					activeHyperlinkOutputIndex,
					pendingSgrOutputIndex,
					returnValue,
				} = hyperlinkState);
			}

			if (pendingSgrOutputIndex !== undefined) {
				returnValue = returnValue.slice(0, pendingSgrOutputIndex);
				activeStyles = pendingSgrActiveStyles;
				pendingSgrOutputIndex = undefined;
				pendingSgrActiveStyles = undefined;
			}

			break;
		}

		({activeStyles, activeHyperlink, activeHyperlinkHasVisibleText, activeHyperlinkOutputIndex, pendingSgrOutputIndex, pendingSgrActiveStyles, position, returnValue, include} = applyToken({
			token,
			isPastEnd,
			start,
			activeStyles,
			activeHyperlink,
			activeHyperlinkHasVisibleText,
			activeHyperlinkOutputIndex,
			pendingSgrOutputIndex,
			pendingSgrActiveStyles,
			position,
			returnValue,
			include,
		}));
	}

	if (!include) {
		return '';
	}

	if (activeHyperlink) {
		returnValue += closeHyperlink(activeHyperlink);
	}

	// Disable active codes at the end
	returnValue += undoAnsiCodes(activeStyles);

	return returnValue;
}
