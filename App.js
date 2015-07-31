Ext.define('FeatureTreeModel', {
    extend: 'Ext.data.TreeModel',
    fields: [
            {name: '_ref', type: 'string'},
            {name: '_type', type: 'string'},
            {name: 'Name', type: 'string'},
            {name: 'Project', type: 'object'},
            {name: 'State', type: 'object'},
            {name: 'PercentDoneByStoryCount', type: 'double'},
            {name: 'FormattedID', type: 'string'},
            {name: 'Owner', type: 'object'},
            {name: 'c_Customer', type: 'string'},
            {name: 'c_LaunchRisk', type: 'object'},
            {name: 'c_OriginalLaunch', type: 'object'},
            {name: 'c_TargetLaunch', type: 'string'},
            {name: 'Notes', type: 'string'}
        ],
    hasMany: {model: 'UserStoryModel', name:'userStories', associationKey: 'userStories'}
});


Ext.define('HierarchicalRequirementTreeModel', {
    extend: 'Ext.data.TreeModel',
    fields: [
            {name: '_ref',type: 'string'}, 
            {name: '_type',type: 'string'}, 
            {name: 'Name',type: 'string'}, 
            {name: 'Project',type: 'object'}, 
            {name: 'ScheduleState',type: 'string'},
            {name: 'FormattedID',type: 'string'}, 
            {name: 'Owner',type: 'object'},
            {name: 'Notes',type: 'string'}
    ]
    //hasMany: {model: 'UserStoryTreeModel', name:'userStories', associationKey: 'userStories'}
});


Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',



    launch: function() {
        this._loadFeatures();
    },


    _loadFeatures: function() {

        var that = this;

        /*console.log("inside data block");*/
        var featureFilter = [{
            property: "State.Name",
            //operator: "=",
            value: 'Started'
        }];

        /*console.log('got data!', featureFilter);*/

        var featureStore = Ext.create('Rally.data.wsapi.Store', {
            model: "PortfolioItem/Feature",
            autoLoad: true,
            filters: featureFilter,
            context: {
                project: this.getContext().getProject()._ref
            },
            fetch: ['Name', 'Project', 'State', 'PercentDoneByStoryCount', 'FormattedID', 'Owner', 'c_LaunchRisk', 'c_OriginalLaunch', 'c_TargetLaunch', 'c_Customer', 'Notes', "UserStories"]
        }).load().then({
            success: this._loadUserStories,
            scope: this
        }).then({
            success: function(userStories) {
                // if(!results){

                // }
                //console.log((userStories));

                that._createGrid(userStories);
            },
            failue: function() {
                console.log("Wrong");
            }
        });

    },

    _loadUserStories: function(features) {
        var promises = [];
        _.each(features, function(feature) {
            var userStories = feature.get('UserStories');
            if (userStories.Count > 0) {
                userStories.store = feature.getCollection('UserStories' /*{fetch:['Name', 'Project','ScheduleState', 'FormattedID', 'Owner', 'Notes']}*/ );
                promises.push(userStories.store.load());
            }

        });

        return Deft.Promise.all(promises);
    },

    _createGrid: function(userStories) {
        var that = this;
        var allFeaturesAdded = [];
        var featureProjectsColl = [];
        var projectUserStoriesColl = [];
        var interimUSColl = [];

        userStories = _.flatten(userStories);
      
        var userStoriesColl = [];

        _.each(userStories, function(thisUserStory) {
            userStoriesColl.push(thisUserStory.data);
        });
        
        


        _.each(userStoriesColl, function(thisUserStory) {
            var featureRecord = thisUserStory.Feature;
            var projectRecord = thisUserStory.Project;
            if(featureRecord && !that.__isFeatureAlreadyPresent(allFeaturesAdded, featureRecord)){
                projectUserStoriesColl.clear();
                
                if(projectRecord && !projectUserStoriesColl.containsKey(projectRecord)){
                    interimUSColl.clear();
                    interimUSColl.add(thisUserStory);
                    projectUserStoriesColl.push({key:projectRecord, value:interimUSColl});
                }
                else{
                    interimUSColl.add(thisUserStory);
                }
                featureProjectsColl.push({key:featureRecord, value:projectUserStoriesColl});
            }
            else{
                
                if(projectRecord && !projectUserStoriesColl.containsKey(projectRecord)){
                    interimUSColl.clear();
                    interimUSColl.add(thisUserStory);
                    projectUserStoriesColl.push({key:projectRecord, value:interimUSColl});
                }
                else{
                    interimUSColl.add(thisUserStory);
                }
                featureProjectsColl.add(projectUserStoriesColl);
                allFeaturesAdded.push(featureRecord);
            }
        });
        
        console.log(featureProjectsColl);
            /*var featureRecord = thisUserStory.Feature;
            if (featureRecord && !that.__isFeatureAlreadyPresent(allFeaturesAdded, featureRecord)){
                var projectRecord = thisUserStory.Project;
                if (projectRecord && (projectRecord.Name === thisUserStory.Project.Name)) {
                    if (!_.contains(interimUSColl, thisUserStory)) {
                        interimUSColl.push(thisUserStory);
                    }
                }*/
                
                
                
            
            
            
/*            //thisRecord.FeatureID = thisRecord.Feature.FormattedID;
            

            if (featureRecord && !that.__isFeatureAlreadyPresent(allFeaturesAdded, featureRecord)) {
                var projectRecord = featureRecord.Project;

                if (projectRecord && (projectRecord.Name === thisUserStory.Project.Name)) {
                    if (!_.contains(interimUSColl, thisUserStory)) {
                        interimUSColl.push(thisUserStory);
                    }
                }

                projectUserStoriesColl.push({
                    key: projectRecord,
                    value: interimUSColl
                });

                console.log(projectUserStoriesColl);
                //var featureUserStoriesColl = [];
                //var userStoryColl = that._getAssociatedUserStoryRecords(featureID, userStoriesColl);
                //console.log(featureUserStoriesColl);

                /*featureUserStoriesColl.push({
                    key: featureRecord,
                    value: userStoryColl
                });
*/
                //allFeaturesAdded.push(featureRecord);

                //allFeaturesWithChildUSerStoriesColl.push(featureUserStoriesColl);

            
       
        
        
        //console.log(allFeaturesAdded);
        //console.log(projectUserStoriesColl);

        //this._createFeatureTreeStore(_.flatten(allFeaturesWithChildUSerStoriesColl));*/
    },

    __isFeatureAlreadyPresent: function(allFeaturesAdded, featureRecord) {
        var isPresent = false;
        Ext.Array.each(allFeaturesAdded, function(thisFeature) {
            if (thisFeature._ref === featureRecord._ref) {
                isPresent = true;
                return false;
            }
        });

        return isPresent;
    },

    /*_getAssociatedUserStoryRecords: function(thisFeatureID, userStoriesColl) {
        var currentUserStoriesColl = [];
        Ext.Array.each(userStoriesColl, function(thisUserStory) {
            if (thisUserStory.Feature && thisUserStory.Feature.FormattedID === thisFeatureID) {
                if (!_.contains(currentUserStoriesColl, thisUserStory)) {
                    currentUserStoriesColl.push(thisUserStory);
                }
            }
        });
        //console.log(currentUserStoriesColl);
        return currentUserStoriesColl;
    },*/

    _createFeatureTreeStore: function(flattenedFeaturesWithUSColl) {
        var featureRootNode = Ext.create('FeatureTreeModel', {
            Name: 'Feature Root',
            text: 'Feature Root',
            root: true,
            expandable: true,
            expanded: true
        });
        this._createFeatureNodesWithChildUSerStories(featureRootNode, flattenedFeaturesWithUSColl);
        var panelHeight = 550;
        var userStoryTreePanel = this._createFeatureTreePanelGrid(featureRootNode, panelHeight);

        /*var container = Ext.getCmp();
        if (container) {
            container.add(userStoryTreePanel);
        }*/

        this.add(userStoryTreePanel);
    },

    _createFeatureNodesWithChildUSerStories: function(featureRootNode, flattenedFeaturesWithUSColl) {
        var that = this;
        Ext.Array.each(flattenedFeaturesWithUSColl, function(thisFlattenedFeatureWithUS) {

            var featureTreeNode = that._createFeatureTreeNode(thisFlattenedFeatureWithUS.key);
            Ext.Array.each(thisFlattenedFeatureWithUS.value, function(thisUserStory) {
                /*Extract out Team information. */
                var userStoryTreeNode = that._createUserStoryTreeNode(thisUserStory);
                featureTreeNode.appendChild(userStoryTreeNode);
            });

            featureRootNode.appendChild(featureTreeNode);
        });
    },

    _createFeatureTreeNode: function(thisFeature) {
        var noEntryText = '--No Entry--';
        var noOwnerText = '--No Owner--';
        var featureTreeNode = Ext.create('FeatureTreeModel', {
            _ref: thisFeature._ref,
            Name: thisFeature.Name,
            FormattedID: thisFeature.FormattedID,
            c_TargetLaunch: this._getFieldText(thisFeature.c_TargetLaunch, '--No Target--'),
            c_LaunchRisk: this._getFieldText(thisFeature.c_LaunchRisk, noEntryText),
            c_OriginalLaunch: this._getFieldText(thisFeature.c_OriginalLaunch, '--No Target--'),
            PercentDoneByStoryCount: thisFeature.PercentDoneByStoryCount,
            Project: this._getFieldText(thisFeature.Project._refObjectName, noEntryText),
            State: (thisFeature.State) ? this._getFieldText(thisFeature.State._refObjectName, noEntryText) : noEntryText,
            Owner: (thisFeature.Owner) ? this._getFieldText(thisFeature.Owner._refObjectName, noEntryText) : noOwnerText,
            c_Customer: this._getFieldText(thisFeature.c_Customer, noEntryText),
            Notes: thisFeature.Notes,
            leaf: (thisFeature._type === 'PortfolioItem/Feature') ? false : true,
            expandable: (thisFeature._type === 'PortfolioItem/Feature') ? true : false,
            expanded: false
                /*iconCls: (thisFeature._type === 'PortfolioItem/Epic') ? 'ico-test-epic' : 'ico-test-feature'*/
        });

        return featureTreeNode;
    },

    _createUserStoryTreeNode: function(thisUserStory) {
        var noEntryText = '--No Entry--';
        var noOwnerText = '--No Owner--';
        var userStoryTreeNode = Ext.create('HierarchicalRequirementTreeModel', {
            _ref: thisUserStory._ref,
            Name: thisUserStory.Name,
            FormattedID: thisUserStory.FormattedID,
            Project: this._getFieldText(thisUserStory.Project._refObjectName, noEntryText),
            ScheduleState: thisUserStory.ScheduleState,
            Owner: (thisUserStory.Owner) ? this._getFieldText(thisUserStory.Owner._refObjectName, noEntryText) : noOwnerText,
            Notes: thisUserStory.Notes,
            expandable: (thisUserStory._type === 'HierarchicalRequirement') ? true : false
        });
        return userStoryTreeNode;
    },

    _createFeatureTreePanelGrid: function(featureRootNode, panelHeight) {
        //var that = this;
        var userStoryTreeStore = Ext.create('Ext.data.TreeStore', {
            model: 'FeatureTreeModel',
            root: featureRootNode

        });

        var userStoryItemTreePanel = Ext.create('Ext.tree.Panel', {
            store: userStoryTreeStore,
            useArrows: true,
            lines: false,
            displayField: 'FormattedID',
            rootVisible: false,
            width: '100%',
            height: 'auto', // Extra scroll for individual sections:
            columns: [{
                    xtype: 'treecolumn',
                    text: 'ID',
                    dataIndex: 'FormattedID',
                    width: 100
                }, {
                    text: 'Name',
                    dataIndex: 'Name',
                    width: 300
                },


                {
                    text: 'Project',
                    dataIndex: 'Project',
                    width: 150
                }, {
                    text: 'State',
                    dataIndex: 'ScheduleState',
                    width: 100
                }, {
                    text: 'Owner',
                    dataIndex: 'Owner',
                    width: 150
                }

                /*{
                    xtype: 'actioncolumn',
                    text: 'Notes',
                    width: 50,
                    items: [{
                        icon: 'https://cdn3.iconfinder.com/data/icons/developerkit/png/View.png', // Use a URL in the icon config
                        width: 75,
                        tooltip: 'View',
                        handler: function(grid, rowIndex, colIndex) {
                            var columnIndex = that._getColumnIndex(grid, 'Notes');
                            if (colIndex == columnIndex) {
                                //popup window code.
                                var record = grid.getStore().getAt(rowIndex);
                                that._displayNotesDailog(record);
                            }
                        }
                    }]
                }*/
            ]
        });

        return userStoryItemTreePanel;

    },

    _getFieldText: function(fieldValue, defaultValue) {
            return _.isUndefined(fieldValue) || _.isNull(fieldValue) ? defaultValue : fieldValue;
        }
        /*this.add({
            xtype: 'rallygrid',
            showPagingToolbar: true,
            showRowActionsColumn: true,
            editable: false,
            store: Ext.create('Rally.data.custom.Store', {
                data: data,
                groupField: 'FeatureID'
            }),
            features: [{
                ftype: 'groupingsummary'
            }],
            columnCfgs: [{
                xtype: 'templatecolumn',
                text: 'ID',
                dataIndex: 'FormattedID',
                width: 100,
                tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
            }, {
                text: 'Name',
                dataIndex: 'Name'
            }, {
                text: 'Feature',
                dataIndex: 'Feature',
                renderer: function(val, meta, record) {
                    return '<a href="https://rally1.rallydev.com/#/detail/feature/' + record.get('Feature').ObjectID + '" target="_blank">' + record.get('Feature').FormattedID + '</a>';
                }
            }]
        });*/


});
