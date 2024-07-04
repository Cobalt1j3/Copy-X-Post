class CopyXPost {
	
	static {
		
		this.SELECTOR_MAIN_NODE = 'main[role="main"]',
		this.SELECTOR_POST = 'article[data-testid="tweet"]',
		this.SELECTOR_CXP = 'div[shadow="cxp"]',
		this.SELECTOR_CARET = '[data-testid="caret"]',
		this.POST_TEXT_SELECTOR = '[data-testid="tweetText"]',
		this.ATTR_MODIFIED = 'data-modified',
		this.rxEmoji = /^https:\/\/.*?\.twimg\.com\/emoji\/.*?$/,
		
		this.bodyObserverInit = { childList: true, subtree: true },
		this.mainObserverInit = { childList: true, subtree: true },
		
		this.cxpAnimationButtonConditions = [
			{
				dataset: [ { name: 'cxpSpawned', value: '' } ],
				name: 'spawn',
				state: 'end'
			},
			{
				dataset: [ { name: 'cxpSpawned' }, { name: 'cxpEntered' }, { name: 'cxpLeft' } ],
				name: 'exit',
				state: 'end'
			}
		];
		
	}
	
	static async createCXP() {
		
		const	{ cxpAnimationButtonConditions } = CopyXPost,
				node = await ShadowElement.create('cxp'),
				{ shadowRoot } = node;
		let copyLabel, link;
		
		(copyLabel = document.createElement('span')).slot = 'copy-label',
		shadowRoot.querySelector('#root').style.display = 'none',
		node.appendChild(copyLabel).textContent = '📋',
		(link = document.createElement('link')).rel = 'stylesheet',
		shadowRoot.appendChild(link).href = browser.runtime.getURL('shadow-copy-x-post-element-injected.css');
		
		for (const label of shadowRoot.querySelectorAll('#buttons button .label'))
			(await ShadowElement.create('anime-conditions', label)).conditions = cxpAnimationButtonConditions;
		
		node.id = 'cpx-' + crypto.randomUUID();
		
		return node;
		
	}
	
	static async enteredButton(event) {
		
		const { target } = event, { dataset: { alt, hint } } = target, label = target.querySelector('.label');
		let hintNode;
		
		label &&	(
						label.toggleAttribute('data-cxp-label-exited', false),
						void label.offsetWidth,
						label.toggleAttribute('data-cxp-label-entered', true)
					);
		
		if (hint && (hintNode = document.getElementById(hint))) {
			
			delete hintNode.dataset.cxpHintExiting,
			delete hintNode.dataset.cxpHintSpawned,
			void hintNode.offsetWidth;
			
		} else {
			
			const { id } =	(hintNode = await ShadowElement.create('anime-conditions')).id =
								target.dataset.hint ??= crypto.randomUUID();
			
			hintNode.conditions = [ { state: 'end', name: 'hint-exit', purges: true } ],
			hintNode.toggleAttribute('data-cxp-hint', true);
			
		}
		
		hintNode.textContent = target.dataset.alt,
		hintNode.toggleAttribute('data-cxp-hint-spawned', true),
		
		hintNode.isConnected || document.body.appendChild(hintNode.element),
		
		ShadowElement.setBoundToCSSVar(hintNode, target),
		
		event.stopPropagation();
		
	}
	
	static async enteredPost(event) {
		
		const { target } = event;
		let node;
		
		if (!(node = target.querySelector(CopyXPost.SELECTOR_CXP))) {
			
			const	{ SELECTOR_CARET, createCXP, enteredButton, exitedAnimation, leftButton } = CopyXPost,
					{ handler, shadowRoot } = node = await createCXP();
			
			target.querySelector(SELECTOR_CARET)?.parentElement.prepend?.(node = node.element);
			
			for (const button of shadowRoot.querySelectorAll('#buttons button'))
				handler.addLifetimeEvent('mouseenter', enteredButton, undefined, button),
				handler.addLifetimeEvent('mouseleave', leftButton, undefined, button);
			
			handler.addLifetimeEvent('animationend', exitedAnimation);
			
		}
		
		node instanceof Element && node.handler instanceof ShadowElement &&
			(
				node.toggleAttribute('data-cxp-entered', true),
				node.removeAttribute('data-cxp-left')
			);
		
	}
	
	static exitedAnimation(event) {
		
		event.stopPropagation();
		
		const { animationName } = event;
		
		animationName === 'exit' && event.target?.handler?.purge?.(undefined, true);
		
	}
	
	// ユーティリティー関数
	// 第一引数 mrs に指定された MurationRecords プロパティ addedNodes, removedNodes を対象に、
	// 第二引数 selector に一致する要素ないしその子孫か先祖を Array に列挙して戻り値にする。
	// 第三引数 isAdded に true を指定した場合 addedNodes、そうでない場合は removedNodes を対象にする。
	static getElementsFromMRs(mrs, selector, isAdded) {
		
		const	{ ELEMENT_NODE } = Node,
				{ length } = mrs,
				nodes = [],
				targetName = (isAdded ? 'add' : 'remov') + 'edNodes';
		let i,i0,l0,i1,l1,i2,l2,i3, targets, target, selected, selectedNode;
		
		i = i3 = -1;
		while (++i < length) {
			
			i0 = -1, l0 = (targets = mrs[i][targetName])?.length;
			while (++i0 < l0) {
				
				if ((target = targets[i0]).nodeType === ELEMENT_NODE) {
					
					target.matches(selector) && (nodes[++i3] = target),
					(selected = target.closest(selector)) && (nodes[++i3] = selected);
					
					if (l1 = (selected = target.querySelectorAll(selector)).length) {
						
						i1 = -1, l2 = i3 + 1;
						while (++i1 < l1) {
							i2 = -1, selectedNode = selected[i1];
							while (++i2 < l2 && nodes[i2] !== selectedNode);
							i2 === i3 || (nodes[i3 = l2++] = selectedNode);
						}
						
					}
					
				}
				
			}
			
		}
		
		return nodes;
		
	}
	
	static async leftButton(event) {
		
		const	{ target } = event,
				hintNode = document.getElementById(target.dataset.hint),
				label = target.querySelector('.label');
		
		hintNode &&	(
						hintNode.toggleAttribute('data-cxp-hint-exiting', true),
						ShadowElement.setBoundToCSSVar(hintNode, target)
					),
		
		label &&	(
						label.toggleAttribute('data-cxp-label-entered', false),
						void label.offsetWidth,
						label.toggleAttribute('data-cxp-label-exited', true)
					);
		
	}
	static leftPost(event) {
		
		const { target } = event;
		
		target.querySelector(CopyXPost.SELECTOR_CXP)?.toggleAttribute?.('data-cxp-left', true);
		
	}
	
	static async mutatedMainNodeChildList(mrs) {
		
		const	{ runtime } = browser,
				{ SELECTOR_CXP, SELECTOR_POST, getElementsFromMRs } = CopyXPost,
				posts = getElementsFromMRs(mrs, SELECTOR_POST, true),
				{ length: postsLength } = posts,
				removedNodes = getElementsFromMRs(mrs, SELECTOR_POST),
				{ length: removedNodesLength } = removedNodes;
		
		if (postsLength) {
			
			const { SELECTOR_CARET, enteredPost, leftPost } = CopyXPost;
			let i, caret, post, node, copyLabel, link;
			
			i = -1;
			while (++i < postsLength)	(
											!(node = (post = posts[i]).querySelector(SELECTOR_CXP)) &&
											(caret = post.querySelector(SELECTOR_CARET))
										) &&
											(
												post.addEventListener('mouseenter', enteredPost),
												post.addEventListener('mouseleave', leftPost)
											);
			
		}
		
		if (removedNodesLength) {
			
			const { enteredPost, leftPost } = CopyXPost;
			let i, node, post;
			
			i = -1;
			while (++i < removedNodesLength)	(post = removedNodes[i]).removeEventListener('mouseover', enteredPost),
												post.removeEventListener('mouseleave', leftPost);
			
		}
		
	}
	
	static startup(mainNode) {
		
		const { mainObserverInit } = CopyXPost, { mutatedMainNodeChildList } = this;
		
		this.mainObserver = new MutationObserver(mutatedMainNodeChildList).observe(mainNode, mainObserverInit);
		
	}
	
	constructor() {
		
		const { mutatedMainNodeChildList, startup } = CopyXPost;
		
		this.mutatedMainNodeChildList = mutatedMainNodeChildList.bind(this),
		this.startup = startup.bind(this);
		
	}
	
	init() {
		
		const	{ SELECTOR_MAIN_NODE, bodyObserverInit } = CopyXPost,
				{ startup } = this,
				initializing = (rs, rj) => {
					
					(this.mainNode = document.querySelector(SELECTOR_MAIN_NODE)) ?
						rs(this.mainNode) :
						(
							this.bodyObserver =
								new MutationObserver
									(
										mrs =>	{
													const mainNode = document.querySelector(SELECTOR_MAIN_NODE);
													
													mainNode &&	(
																	this.bodyObserver.disconnect(),
																	rs(this.mainNode = mainNode)
																);
												}
									)
						).observe(document.body, bodyObserverInit);
					
				};
		
		return this.initialized = new Promise(initializing).then(startup);
		
	}
	
}

class ShadowScraperElement extends ShadowElement {
	
	static {
		
		this.$scrapers = Symbol('ShadowScraperElement.scrapers');
		
	}
	
	constructor() {
		
		super();
		
		const	{ $scrapers } = ShadowScraperElement,
				scrapers = this.constructor[$scrapers] ?? [], _scrapers = this[$scrapers] = [];
		let i,l, v;
		
		i = -1, l = (Array.isArray(scrapers) ? scrapers : [ scrapers ]).length;
		while (++i < l) typeof (v = scrapers[i]) === 'function' && (_scrapers[i] = v.bind(this));
		
	}
	
	scrape(node) {
		
		if (node instanceof Element) {
			
			const { assign } = Object, { $scrapers } = ShadowScraperElement, scrapers = this[$scrapers], scraped = {};
			let i,l, v;
			
			i = -1, l = (Array.isArray(scrapers) ? scrapers : [ scrapers ]).length;
			while (++i < l)	typeof (typeof (v = scrapers[i]) === 'function' ?
								(v = v(node, scraped)) : v) && typeof v === 'object' && assign(scraped, v);
			
			return scraped;
			
		}
		
		return {};
		
	}
	
}

class ShadowCopyXPostElement extends ShadowScraperElement {
	
	static {
		
		this.SELECTOR_POST = CopyXPost.SELECTOR_POST,
		
		this.tag = 'cxp',
		this.templateURL = 'shadow-copy-x-post-element.html'
		
	}
	
	static [ShadowScraperElement.$scrapers] = [
		
		this.convertPostToText
		
	];
	
	static clickedCopyButton(event) {
		
		const	scraped = this.scrape(this.element.closest(ShadowCopyXPostElement.SELECTOR_POST)),
				{ plainPostText } = scraped;
		hi(scraped);
		plainPostText && navigator.clipboard.writeText(plainPostText.join(''));
		
		event.preventDefault(), event.stopPropagation();
		
	}
	
	static clickedDevCopyButton(event) {
		
		navigator.clipboard.writeText(this.element.closest(ShadowCopyXPostElement.SELECTOR_POST).outerHTML);
		
		event.preventDefault(), event.stopPropagation();
		
	}
	
	static convertPostToText(post, scraped) {
		
		const	{ POST_TEXT_SELECTOR, rxEmoji } = CopyXPost,
				textNode = post.querySelector(POST_TEXT_SELECTOR),
				{ children } = textNode,
				{ length } = children,
				text = [];
		let i,i0, child;
		
		i = i0 = -1;
		while (++i < length) {
			
			switch ((child = children[i]).tagName.toLowerCase()) {
				
				case 'img':
				if (rxEmoji.test(child.src)) {
					
					text[++i0] = child.getAttribute('alt');
					
				}
				break;
				
				default:
				text[++i0] = child.textContent;
				break;
				
			}
			
		}
		
		return i0 === -1 ? null : { plainPostText: text };
		
	}
	
	constructor() {
		
		super();
		
		const	{ SELECTOR_POST, clickedCopyButton, clickedDevCopyButton } = ShadowCopyXPostElement,
				{ shadowRoot } = this,
				devCopyLabel = document.createElement('span');
		
		devCopyLabel.slot = 'dev-copy-label',
		devCopyLabel.textContent = '🔬',
		this.element.appendChild(devCopyLabel),
		
		this.addLifetimeEvent	(
									'click',
									this.clickedCopyButton = clickedCopyButton.bind(this),
									undefined,
									shadowRoot.getElementById('copy-button')
								),
		this.addLifetimeEvent	(
									'click',
									this.clickedDevCopyButton = clickedDevCopyButton.bind(this),
									undefined,
									shadowRoot.getElementById('dev-copy-button')
								);
		
	}
	
}
ShadowCopyXPostElement.define();