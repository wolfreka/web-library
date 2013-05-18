Zotero.ui.widgets.newItem = {};

Zotero.ui.widgets.newItem.init = function(el){
    Z.debug("newItem eventfulwidget init", 3);
    var widgetEl = J(el);
    Zotero.ui.eventful.listen("newItem", Zotero.ui.widgets.newItem.freshitemcallback, {widgetEl: el});
    Zotero.ui.eventful.listen("itemTypeChanged", Zotero.ui.widgets.newItem.changeItemType, {widgetEl: el});
    widgetEl.on('change', 'select.itemType', function(e){
        Zotero.ui.eventful.trigger('itemTypeChanged', {triggeringElement:el});
    });
};

Zotero.ui.widgets.newItem.freshitemcallback = function(e){
    Z.debug('Zotero eventful new item', 3);
    var widgetEl = e.data.widgetEl;
    var el = widgetEl;
    var triggeringEl = J(e.triggeringElement);
    var itemType = triggeringEl.data("itemtype");
    
    var newItem = new Zotero.Item();
    var d = newItem.initEmpty(itemType);
    d.done(J.proxy(function(item){
        Zotero.ui.unassociatedItemForm(widgetEl, item);
    }, this) );
    d.fail(function(jqxhr, textStatus, errorThrown){
        Zotero.ui.jsNotificationMessage("Error loading item template", 'error');
    });
    
    return;
};

Zotero.ui.unassociatedItemForm = function(el, item){
    Z.debug("Zotero.ui.unassociatedItem", 3);
    Z.debug(item, 3);
    var container = J(el);
    var d = Zotero.Item.prototype.getCreatorTypes(item.itemType);
    d.done(J.proxy(function(itemCreatorTypes){
        container.empty();
        if(item.itemType == 'note'){
            var parentKey = Zotero.nav.getUrlVar('parentKey');
            if(parentKey){
                item.parentKey = parentKey;
            }
            J.tmpl('editnoteformTemplate', {item:item,
                                         itemKey:item.itemKey
                                         }).appendTo(container);
            
            Zotero.ui.init.rte('default');
        }
        else {
            J.tmpl('itemformTemplate', {item:item,
                                        itemKey:item.itemKey,
                                        creatorTypes:itemCreatorTypes,
                                        citable:true,
                                        saveable:false
                                        }
                                        ).appendTo(container);
            if(item.apiObj.tags.length === 0){
                Zotero.ui.addTag(container, false);
            }
            Zotero.ui.init.creatorFieldButtons();
            Zotero.ui.init.tagButtons();
            Zotero.ui.init.editButton();
        }
        
        container.find(".directciteitembutton").bind('click', J.proxy(function(e){
            Zotero.ui.updateItemFromForm(item, container.find("form"));
            Zotero.ui.eventful.trigger('citeItems', {"zoteroItems": [item]});
        }, this) );
        
        container.on("click", "button.switch-two-field-creator-link", Zotero.ui.callbacks.switchTwoFieldCreators);
        container.on("click", "button.switch-single-field-creator-link", Zotero.ui.callbacks.switchSingleFieldCreator);
        container.on("click", "button.remove-creator-link", Zotero.ui.removeCreator);
        container.on("click", "button.add-creator-link", Zotero.ui.addCreator);
        
        
        Z.debug("Setting newitem data on container");
        Z.debug(item);
        Z.debug(container);
        container.data('item', item);
        
        //load data from previously rendered form if available
        Zotero.ui.loadFormData(container);
        
        Zotero.ui.createOnActivePage(container);
    }, this) );
    
};

Zotero.ui.widgets.newItem.changeItemType = function(e){
    var widgetEl = Zotero.ui.parentWidgetEl(e);
    Z.debug(widgetEl.length);
    var itemType = widgetEl.find("select.itemType").val();
    Z.debug("newItemType:" + itemType);
    
    //TODO: save values from current item and put them into new item
    var oldItem = widgetEl.data('item');
    Zotero.ui.updateItemFromForm(oldItem, widgetEl.find("form"));
    var newItem = new Zotero.Item();
    //newItem.libraryType = library.libraryType;
    //newItem.libraryID = library.libraryID;
    var d = newItem.initEmpty(itemType);
    d.done(J.proxy(function(item){
        Zotero.ui.translateItemType(oldItem, item);
        Zotero.ui.unassociatedItemForm(widgetEl, item);
    }, this) );
    d.fail(function(jqxhr, textStatus, errorThrown){
        Zotero.ui.jsNotificationMessage("Error loading item template", 'error');
    });
    
    return;
};

Zotero.ui.translateItemType = function(firstItem, newItem){
    Z.debug("Zotero.ui.translateItemType");
    J.each(Zotero.Item.prototype.fieldMap, function(field, val){
        if( (field != "itemType") && firstItem.apiObj.hasOwnProperty(field) && newItem.apiObj.hasOwnProperty(field)){
            Z.debug("transferring value for " + field + ": " + firstItem.get(field));
            newItem.set(field, firstItem.get(field));
        }
    });
};
