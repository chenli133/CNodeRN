import React from 'react'
import { View, Text, ListView, TouchableOpacity, Animated, Image, RefreshControl, TouchableHighlight } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import ScrollabelTabView from 'react-native-scrollable-tab-view'
import container from 'redux-container'
import { topicsReducer } from './reducer'
import { fetchTopics, filterTopics } from './action'
import preferredThemer from '../../theme/'
import defaultStyles from './stylesheet/topics'
import { Tabs,LoadMore,Loading } from '../../component/'

const initialState = {
    selected: 0,
    categories: [{
            code: "",
            name: "全部",
            pageIndex: 1,
            list: []
        },
        {
            code: "good",
            name: "精华",
            pageIndex: 1,
            list: []
        },
        {
            code: "share",
            name: "分享",
            pageIndex: 1,
            list: []
        },
        {
            code: 'job',
            name: "招聘",
            pageIndex: 1,
            list: []
        }
    ]
}

@preferredThemer(defaultStyles)
@container(topicsReducer, initialState, { fetchTopics, filterTopics },state=>({
    ...state,
    ...state.screenProps
}))
class Topics extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loading: false,
            refreshing: false,
            dataSources: props.categories.map(category => {
                return new ListView.DataSource({
                    rowHasChanged(r1, r2) {
                        return r1 !== r2
                    }
                })
            })
        }
        this.renderRow = this.renderRow.bind(this)
        this.handleTabChange = this.handleTabChange.bind(this)
        this.handleLoadMore = this.handleLoadMore.bind(this)
        this.handleRefresh = this.handleRefresh.bind(this)
    }
    handleTabChange({ i, tab }) {
        const { categories } = this.props
        const { fetchTopics } = this.props.actions
        let code = categories[i].code
        fetchTopics({ code })
    }
    handleRefresh() {
        const { categories, selected } = this.props
        const { fetchTopics } = this.props.actions
        let code = categories[selected].code
        // this.setState({ refreshing: false })
        fetchTopics({ code, pageIndex: 1, pageSize: 10, options: { caching: false } })
    }
    handleLoadMore() {
        const { categories, selected } = this.props
        const { fetchTopics } = this.props.actions
        let code = categories[selected].code
        let pageIndex = categories[selected].pageIndex + 1
        fetchTopics({ code, pageIndex })
    }
    componentDidMount() {
        const { fetchTopics } = this.props.actions
        fetchTopics()
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.topicsFetched) {
            const { categories, selected } = nextProps
            this.setState({
                dataSources: this.state.dataSources.map((dataSource, i) => {
                    if (selected == i) {
                        return dataSource.cloneWithRows(categories[selected].list)
                    }
                    return dataSource
                })
            })
        }
    }
    renderRow(topic) {
        let avatarURL = topic.author.avatar_url
        if (/^\/\/.*/.test(avatarURL)) {
            avatarURL = 'http:' + avatarURL
        }
        let { styles } = this.props
        let {navigate} = this.props.navigation
        return (
            <TouchableOpacity onPress={()=>navigate('topic',{id:topic.id})}>
            <Animated.View style={styles["topicCell"]}>
                    <View style={styles.topicBreif}>
                        <Image source={{uri:avatarURL}} style={styles.topicImage}/>
                        <View style={styles.topicSubtitle}>
                            <Text style={styles["topicSubtitleText"]}>{topic.author.loginname}</Text>
                            <View style={styles.topicMintitle}>
                                <Text style={styles.topicMintitleText}>{topic.create_at}</Text>
                                <View style={styles["topicTag"]}>
                                    <Text style={styles["topicTagText"]}>{topic.tab}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.topicAccessory}>
                            <Text style={styles.topicStatic}><Text style={styles.topicReply}>{topic.reply_count}</Text> /{topic.visit_count}</Text>
                        </View>
                    </View>
                    <View style={styles.topicTitle}>
                        <Text style={[styles.topicTitleText,{fontSize:14}]} numberOfLines={2}>{topic.title}</Text>
                    </View>
            </Animated.View>
            </TouchableOpacity>
        )
    }
    render() {
        const { styles, categories, styleConstants, selected ,topicsFetching} = this.props
        const renderTabBar = () => (
            <Tabs style={styles.tab} 
                selectedStyle={styles.selectedTab}>
                    {categories.map(v=>(
                        <Text style={styles.unselectedTab} key={v.name}>{v.name}</Text>
                    ))}
                </Tabs>
        )
        const loadingColor = styleConstants.loadingColor
        const refreshControl = (
            <RefreshControl refreshing={this.state.refreshing} 
            title="下拉刷新" 
            titleColor={loadingColor} 
            onRefresh={this.handleRefresh}/>
        )
        const renderFooter = () => categories[selected].list.length > 0 ?
            <LoadMore active={topicsFetching}/> : null
        const renderSeparator = (sectionId,rowId)=><View key={`${sectionId}-${rowId}`} style={styles["cellSeparator"]}/>
        return (
            <View style={styles.container}>
                <ScrollabelTabView renderTabBar={renderTabBar} onChangeTab={this.handleTabChange} prerenderingSiblingsNumber={0}>
                    {categories.map((v,i)=>(
                        <View style={styles.tabContainer} key={v.name}>
                        {v.list.length === 0 && topicsFetching ?<Loading color={loadingColor}/>:(
                            <ListView dataSource={this.state.dataSources[i]} renderRow={this.renderRow} enableEmptySections={true}
                            refreshControl={refreshControl}
                            onEndReached={this.handleLoadMore.bind(this)} onEndReachedThreshold={10} initialListSize={6}
                            renderSeparator={renderSeparator}
                            renderFooter={renderFooter}
                            />
                        )}
                        </View>
                    ))}
                </ScrollabelTabView>
            </View>
        )
    }
}

export default Topics