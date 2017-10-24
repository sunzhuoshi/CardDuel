var CardTemplateDefineList = require('./config.js').CardTemplateDefineList;

function CardTemplate(id, type, value) {
    this.id = id;
    this.type = type;
    this.value = value;
}

function CardTemplateManager() {
	this.items = {};

	CardTemplateDefineList.forEach((cardTemplateDefine) => {
		let cardTemplate = new CardTemplate(cardTemplateDefine[0], cardTemplateDefine[1], cardTemplateDefine[2]);
		this.items[cardTemplate.id] = cardTemplate;
	});
	
	this.getCardTemplate = function(id) {
		return this.items[id];
	}
	CardTemplateManager.instance = this;
}

new CardTemplateManager();

module.exports = {
    CardTemplate: CardTemplate,
    CardTemplateManager: CardTemplateManager
}